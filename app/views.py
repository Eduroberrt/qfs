from django.shortcuts import render
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes, parser_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from .models import Account, Transaction, JournalEntry, KYCVerification, SupportTicket, SupportReply, Notification, DepositTransaction, Wallet, WalletCopyTracking
from .serializers import (
    AccountSerializer, TransactionSerializer, JournalEntrySerializer,
    KYCVerificationSerializer, KYCSubmissionSerializer, KYCStatusSerializer,
    DepositTransactionSerializer, WalletSerializer
)

@api_view(['GET'])
def api_status(request):
    """API status endpoint"""
    return Response({
        'status': 'ok',
        'message': 'QFS Ledger API is running',
        'version': '1.0.0'
    }, status=status.HTTP_200_OK)

class AccountViewSet(viewsets.ModelViewSet):
    """Account management API"""
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]

class TransactionViewSet(viewsets.ModelViewSet):
    """Transaction management API"""
    queryset = Transaction.objects.all().order_by('-created_at')
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class JournalEntryViewSet(viewsets.ModelViewSet):
    """Journal Entry management API"""
    queryset = JournalEntry.objects.all()
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated]


# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """User registration endpoint"""
    try:
        # Add some debugging
        print(f"Registration request received: {request.method}")
        print(f"Request data: {request.data}")
        print(f"Request headers: {dict(request.headers)}")
        
        data = request.data
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        
        print(f"Parsed data - name: {name}, email: {email}, password: {'***' if password else None}")
        
        # Validate required fields
        if not all([name, email, password]):
            return Response({
                'error': 'All fields (name, email, password) are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'User with this email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = User.objects.create_user(
            username=email,  # Using email as username
            email=email,
            password=password,
            first_name=name
        )
        
        print(f"User created successfully: {user.id}")
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        return Response({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'name': user.first_name,
                'email': user.email
            },
            'tokens': {
                'access': str(access_token),
                'refresh': str(refresh)
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return Response({
            'error': f'Registration failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """User login endpoint"""
    try:
        data = request.data
        email = data.get('email')
        password = data.get('password')
        
        # Validate required fields
        if not all([email, password]):
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user
        user = authenticate(username=email, password=password)
        
        if user is None:
            return Response({
                'error': 'Invalid email or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        return Response({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'name': user.first_name,
                'email': user.email
            },
            'tokens': {
                'access': str(access_token),
                'refresh': str(refresh)
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Login failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get current user profile"""
    try:
        user = request.user
        return Response({
            'user': {
                'id': user.id,
                'name': user.first_name,
                'email': user.email,
                'username': user.username
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to get user profile: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password"""
    try:
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not old_password or not new_password:
            return Response({
                'error': 'Both old and new passwords are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify old password
        if not user.check_password(old_password):
            return Response({
                'error': 'Old password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to change password: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Request password reset"""
    from django.core.mail import send_mail
    from django.contrib.auth.tokens import PasswordResetTokenGenerator
    from django.utils.http import urlsafe_base64_encode
    from django.utils.encoding import force_bytes
    from django.conf import settings
    import uuid
    
    try:
        data = request.data
        email = data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if user exists or not for security
            return Response({
                'message': 'If an account with this email exists, you will receive a password reset email.'
            }, status=status.HTTP_200_OK)
        
        # Generate password reset token
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Create reset URL (frontend will handle this)
        reset_url = f"{settings.FRONTEND_URL or 'https://www.qfsvaultledger.org'}/reset-password?token={uid}-{token}"
        
        # Send email (if SMTP is configured)
        try:
            subject = 'Password Reset - QFS Vault Ledger'
            message = f"""
Hi {user.first_name or user.username},

You have requested to reset your password for QFS Vault Ledger.

Click the link below to reset your password:
{reset_url}

This link will expire in 24 hours for security reasons.

If you did not request this password reset, please ignore this email.

Best regards,
QFS Vault Ledger Team
            """
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL or 'noreply@qfsvaultledger.org',
                [email],
                fail_silently=False,
            )
            
        except Exception as email_error:
            print(f"Failed to send password reset email: {email_error}")
            # Continue anyway - we'll return success to not reveal user existence
        
        return Response({
            'message': 'If an account with this email exists, you will receive a password reset email.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Forgot password error: {e}")
        return Response({
            'error': 'Failed to process password reset request'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password with token"""
    from django.contrib.auth.tokens import PasswordResetTokenGenerator
    from django.utils.http import urlsafe_base64_decode
    from django.utils.encoding import force_str
    
    try:
        data = request.data
        token = data.get('token')
        password = data.get('password')
        
        if not token or not password:
            return Response({
                'error': 'Token and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 6:
            return Response({
                'error': 'Password must be at least 6 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse token
        try:
            uid, reset_token = token.split('-', 1)
            uid = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid)
        except (ValueError, TypeError, OverflowError, User.DoesNotExist):
            return Response({
                'error': 'Invalid reset token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify token
        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, reset_token):
            return Response({
                'error': 'Invalid or expired reset token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Reset password
        user.set_password(password)
        user.save()
        
        return Response({
            'message': 'Password reset successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Reset password error: {e}")
        return Response({
            'error': 'Failed to reset password'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# KYC Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def submit_kyc_document(request):
    """Submit KYC document for verification"""
    try:
        user = request.user
        
        # Get or create KYC verification record
        kyc_verification, created = KYCVerification.objects.get_or_create(
            user=user,
            defaults={'status': 'not_submitted'}
        )
        
        # Don't allow resubmission if already verified
        if kyc_verification.status == 'verified':
            return Response({
                'error': 'Your documents have already been verified'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use the submission serializer
        serializer = KYCSubmissionSerializer(kyc_verification, data=request.data, partial=True)
        
        if serializer.is_valid():
            # Update status to pending when document is submitted
            serializer.save(status='pending', submitted_at=timezone.now())
            
            return Response({
                'message': 'Document submitted successfully for verification'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Invalid document data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'error': f'Failed to submit document: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def kyc_status(request):
    """Get current user's KYC verification status"""
    try:
        user = request.user
        
        try:
            kyc_verification = KYCVerification.objects.get(user=user)
            serializer = KYCStatusSerializer(kyc_verification)
            return Response({
                'status': kyc_verification.status,
                'documents': [serializer.data] if kyc_verification.document_file else []
            }, status=status.HTTP_200_OK)
        except KYCVerification.DoesNotExist:
            return Response({
                'status': 'not_submitted',
                'documents': []
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            'error': f'Failed to get KYC status: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_kyc_list(request):
    """Get all KYC submissions for admin review"""
    try:
        kyc_submissions = KYCVerification.objects.exclude(status='not_submitted').order_by('-submitted_at')
        serializer = KYCVerificationSerializer(kyc_submissions, many=True, context={'request': request})
        
        return Response({
            'submissions': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to get KYC submissions: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_kyc_review(request, kyc_id):
    """Admin endpoint to approve/reject KYC verification"""
    try:
        kyc_verification = KYCVerification.objects.get(id=kyc_id)
        
        action = request.data.get('action')  # 'approve' or 'reject'
        notes = request.data.get('notes', '')
        
        if action not in ['approve', 'reject']:
            return Response({
                'error': 'Action must be either "approve" or "reject"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update verification status
        kyc_verification.status = 'verified' if action == 'approve' else 'rejected'
        kyc_verification.admin_notes = notes
        kyc_verification.reviewed_at = timezone.now()
        kyc_verification.reviewed_by = request.user
        kyc_verification.save()
        
        return Response({
            'message': f'KYC verification {action}d successfully'
        }, status=status.HTTP_200_OK)
        
    except KYCVerification.DoesNotExist:
        return Response({
            'error': 'KYC verification not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Failed to review KYC: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Support Ticket Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_support_ticket(request):
    """Create a new support ticket"""
    try:
        data = request.data
        
        # Validate required fields
        required_fields = ['department', 'subject', 'message']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'error': f'{field.title()} is required'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create support ticket
        ticket = SupportTicket.objects.create(
            user=request.user,
            department=data['department'],
            subject=data['subject'],
            message=data['message']
        )
        
        # Create notification for user
        Notification.objects.create(
            user=request.user,
            type='support_ticket',
            title='Support Ticket Submitted',
            message=f'Your support ticket #{ticket.ticket_id} has been received and assigned to our team. You will receive a response within 24 hours.',
            support_ticket=ticket
        )
        
        return Response({
            'message': 'Support ticket created successfully',
            'ticket_id': ticket.ticket_id
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to create support ticket: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_support_tickets(request):
    """Get all support tickets for the authenticated user"""
    try:
        tickets = SupportTicket.objects.filter(user=request.user)
        
        tickets_data = []
        for ticket in tickets:
            replies = ticket.replies.all()
            replies_data = []
            for reply in replies:
                if not reply.is_internal:  # Only show non-internal replies to users
                    replies_data.append({
                        'id': reply.id,
                        'user': reply.user.username,
                        'message': reply.message,
                        'created_at': reply.created_at.isoformat(),
                        'is_admin': reply.user.is_staff
                    })
            
            tickets_data.append({
                'ticket_id': ticket.ticket_id,
                'department': ticket.department,
                'subject': ticket.subject,
                'message': ticket.message,
                'status': ticket.status,
                'priority': ticket.priority,
                'created_at': ticket.created_at.isoformat(),
                'updated_at': ticket.updated_at.isoformat(),
                'replies': replies_data
            })
        
        return Response({
            'tickets': tickets_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to fetch support tickets: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reply_to_support_ticket(request, ticket_id):
    """Reply to a support ticket"""
    try:
        ticket = SupportTicket.objects.get(ticket_id=ticket_id, user=request.user)
        message = request.data.get('message')
        
        if not message:
            return Response({
                'error': 'Message is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create reply
        reply = SupportReply.objects.create(
            ticket=ticket,
            user=request.user,
            message=message,
            is_internal=False
        )
        
        # Update ticket status if it was closed
        if ticket.status == 'closed':
            ticket.status = 'open'
            ticket.save()
        
        return Response({
            'message': 'Reply added successfully'
        }, status=status.HTTP_201_CREATED)
        
    except SupportTicket.DoesNotExist:
        return Response({
            'error': 'Support ticket not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Failed to reply to support ticket: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Notification Views
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_user_notifications(request):
    """Get all notifications for the authenticated user"""
    try:
        notifications = Notification.objects.filter(user=request.user)
        
        notifications_data = []
        for notification in notifications:
            notifications_data.append({
                'id': notification.id,
                'type': notification.type,
                'title': notification.title,
                'message': notification.message,
                'is_read': notification.is_read,
                'support_ticket_id': notification.support_ticket.ticket_id if notification.support_ticket else None,
                'created_at': notification.created_at.isoformat(),
                'read_at': notification.read_at.isoformat() if notification.read_at else None
            })
        
        return Response({
            'notifications': notifications_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to fetch notifications: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def mark_notification_read(request):
    """Mark a notification as read"""
    try:
        notification_id = request.data.get('notification_id')
        if not notification_id:
            return Response({
                'error': 'notification_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.mark_as_read()
        
        return Response({
            'message': 'Notification marked as read'
        }, status=status.HTTP_200_OK)
        
    except Notification.DoesNotExist:
        return Response({
            'error': 'Notification not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Failed to mark notification as read: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read for the authenticated user"""
    try:
        notifications = Notification.objects.filter(user=request.user, is_read=False)
        for notification in notifications:
            notification.mark_as_read()
        
        return Response({
            'message': f'Marked {notifications.count()} notifications as read'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to mark notifications as read: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Admin Support Views
@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_all_support_tickets(request):
    """Get all support tickets for admin"""
    try:
        tickets = SupportTicket.objects.all()
        
        tickets_data = []
        for ticket in tickets:
            replies = ticket.replies.all()
            replies_data = []
            for reply in replies:
                replies_data.append({
                    'id': reply.id,
                    'user': reply.user.username,
                    'message': reply.message,
                    'is_internal': reply.is_internal,
                    'created_at': reply.created_at.isoformat(),
                    'is_admin': reply.user.is_staff
                })
            
            tickets_data.append({
                'ticket_id': ticket.ticket_id,
                'user': {
                    'id': ticket.user.id,
                    'username': ticket.user.username,
                    'email': ticket.user.email
                },
                'department': ticket.department,
                'subject': ticket.subject,
                'message': ticket.message,
                'status': ticket.status,
                'priority': ticket.priority,
                'assigned_to': ticket.assigned_to.username if ticket.assigned_to else None,
                'created_at': ticket.created_at.isoformat(),
                'updated_at': ticket.updated_at.isoformat(),
                'replies': replies_data
            })
        
        return Response({
            'tickets': tickets_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to fetch support tickets: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_reply_to_support_ticket(request):
    """Admin reply to a support ticket"""
    try:
        ticket_id = request.data.get('ticket_id')
        if not ticket_id:
            return Response({
                'error': 'ticket_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        ticket = SupportTicket.objects.get(id=ticket_id)  # Use id instead of ticket_id
        message = request.data.get('message')
        is_internal = request.data.get('is_internal', False)
        
        if not message:
            return Response({
                'error': 'Message is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create reply
        reply = SupportReply.objects.create(
            ticket=ticket,
            user=request.user,
            message=message,
            is_internal=is_internal
        )
        
        # If not internal reply, create notification for user
        if not is_internal:
            Notification.objects.create(
                user=ticket.user,
                type='support_reply',
                title='Support Ticket Response',
                message=f'We have responded to your support ticket #{ticket.ticket_id}. Please check your ticket for our response.',
                support_ticket=ticket
            )
        
        # Update ticket status
        new_status = request.data.get('status')
        if new_status and new_status in [choice[0] for choice in SupportTicket.STATUS_CHOICES]:
            ticket.status = new_status
            if new_status == 'closed':
                ticket.closed_at = timezone.now()
            ticket.save()
        
        return Response({
            'message': 'Reply added successfully'
        }, status=status.HTTP_201_CREATED)
        
    except SupportTicket.DoesNotExist:
        return Response({
            'error': 'Support ticket not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Failed to reply to support ticket: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ================================================
# Deposit API Endpoints
# ================================================

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_deposit(request):
    """
    Create a deposit transaction when user clicks 'Proceed' - 
    meaning they have manually sent crypto to the provided address
    """
    try:
        coin_type = request.data.get('coin_type')
        if not coin_type:
            return Response({
                'error': 'Coin type is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Your actual wallet addresses - REAL ADDRESSES  
        wallet_addresses = {
            'bitcoin': 'bc1qgvry4pf374d7wgddslw7gymrfm2geswsde26ct',  # Real Bitcoin address
            'ethereum': '0xdd1727b7E38E19f4fe9cf6C0aEbA72b22d5B3C2f',  # Real Ethereum address
            'ripple': 'rGhee3BsGTR9dS1eep4WvcoTEfF7EDGFq2',  # Real Ripple address
            'stellar': 'GBAFJKIU3S2UKSVGL7RK4PMY3HRHHN4DPGYNX5PHWUQAZRFEJBU7TGI5',  # Real Stellar address
            'usdt': '0xdd1727b7E38E19f4fe9cf6C0aEbA72b22d5B3C2f',  # Real USDT address (same as ETH)
            'bnb': '0xdd1727b7E38E19f4fe9cf6C0aEbA72b22d5B3C2f',  # Real BNB address
            'bnb_tiger': '0xdd1727b7E38E19f4fe9cf6C0aEbA72b22d5B3C2f',  # Real BNB Tiger address
        }
        
        wallet_address = wallet_addresses.get(coin_type)
        if not wallet_address:
            return Response({
                'error': 'Unsupported coin type'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create deposit record
        deposit = DepositTransaction.objects.create(
            user=request.user,
            coin_type=coin_type,
            amount=request.data.get('amount'),
            wallet_address=wallet_address,
            status='pending'
        )
        
        # Create notification for user
        Notification.objects.create(
            user=request.user,
            type='general',
            title='Deposit Initiated',
            message=f'You have initiated a {deposit.get_coin_type_display()} deposit. Please wait for admin confirmation.'
        )
        
        return Response({
            'message': 'Deposit transaction created successfully',
            'deposit_id': deposit.id,
            'status': deposit.status
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to create deposit: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_user_deposits(request):
    """
    Get deposit history for the current user
    """
    try:
        deposits = DepositTransaction.objects.filter(user=request.user).order_by('-created_at')
        serializer = DepositTransactionSerializer(deposits, many=True)
        
        return Response({
            'deposits': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to retrieve deposits: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_wallet_address(request):
    """
    Get wallet address for a specific coin type
    """
    try:
        coin_type = request.GET.get('coin_type')
        if not coin_type:
            return Response({
                'error': 'Coin type is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Your actual wallet addresses - REAL ADDRESSES
        wallet_addresses = {
            'bitcoin': 'bc1qgvry4pf374d7wgddslw7gymrfm2geswsde26ct',  # Real Bitcoin address
            'ethereum': '0xdd1727b7E38E19f4fe9cf6C0aEbA72b22d5B3C2f',  # Real Ethereum address
            'ripple': 'rGhee3BsGTR9dS1eep4WvcoTEfF7EDGFq2',  # Real Ripple address
            'stellar': 'GBAFJKIU3S2UKSVGL7RK4PMY3HRHHN4DPGYNX5PHWUQAZRFEJBU7TGI5',  # Real Stellar address
            'usdt': '0xdd1727b7E38E19f4fe9cf6C0aEbA72b22d5B3C2f',  # Real USDT address (same as ETH)
            'bnb': '0xdd1727b7E38E19f4fe9cf6C0aEbA72b22d5B3C2f',  # Real BNB address
            'bnb_tiger': '0xdd1727b7E38E19f4fe9cf6C0aEbA72b22d5B3C2f',  # Real BNB Tiger address
        }
        
        wallet_address = wallet_addresses.get(coin_type)
        if not wallet_address:
            return Response({
                'error': 'Unsupported coin type'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'coin_type': coin_type,
            'wallet_address': wallet_address
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to get wallet address: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_wallet_balance(request):
    """
    Get user wallet balances for all cryptocurrencies
    """
    try:
        wallet, created = Wallet.objects.get_or_create(user=request.user)
        serializer = WalletSerializer(wallet)
        
        return Response({
            'wallet': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to retrieve wallet balance: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def track_wallet_copy(request):
    """
    Track when user copies a wallet address
    """
    try:
        coin_type = request.data.get('coin_type')
        wallet_address = request.data.get('wallet_address')
        
        if not coin_type or not wallet_address:
            return Response({
                'error': 'coin_type and wallet_address are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate coin type
        valid_coins = ['bitcoin', 'ethereum', 'ripple', 'stellar', 'usdt', 'bnb', 'bnb_tiger']
        if coin_type not in valid_coins:
            return Response({
                'error': 'Invalid coin type'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get client IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        # Get user agent
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Create tracking record
        from .models import WalletCopyTracking
        tracking_record = WalletCopyTracking.objects.create(
            user=request.user,
            coin_type=coin_type,
            wallet_address=wallet_address,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Send notification to admins
        try:
            from .email_services import send_wallet_copy_notification
            send_wallet_copy_notification(tracking_record)
        except Exception as email_error:
            # Log email error but don't fail the request
            print(f"Failed to send wallet copy notification: {email_error}")
        
        return Response({
            'message': 'Wallet copy tracked successfully',
            'tracking_id': tracking_record.id
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to track wallet copy: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
