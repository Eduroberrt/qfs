"""
Email services for QFS Ledger application
"""
import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from typing import Optional
from .models import DepositTransaction

logger = logging.getLogger(__name__)


def send_deposit_confirmation_email(deposit: DepositTransaction) -> bool:
    """
    Send deposit confirmation email to user when deposit is confirmed by admin.
    
    Args:
        deposit: DepositTransaction instance that was confirmed
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Check if email was already sent to prevent duplicates
        if deposit.email_sent:
            logger.info(f"Email already sent for deposit {deposit.id}")
            return True
            
        # Check if deposit is confirmed
        if deposit.status != 'confirmed':
            logger.warning(f"Attempted to send confirmation email for non-confirmed deposit {deposit.id}")
            return False
            
        # Get user email
        user_email = deposit.user.email
        if not user_email:
            logger.error(f"No email address found for user {deposit.user.username}")
            return False
            
        # Prepare email context
        # Conversion rates for USD calculation
        conversion_rates = {
            'bitcoin': 67234.56,
            'ethereum': 3456.78,
            'ripple': 0.5234,
            'stellar': 0.1123,
            'usdt': 1.00,
            'bnb': 543.21,
            'bnb_tiger': 0.0045
        }
        
        # Calculate USD amount
        usd_amount = 0
        if deposit.amount and deposit.coin_type in conversion_rates:
            usd_amount = float(deposit.amount) * conversion_rates[deposit.coin_type]
        
        context = {
            'user': deposit.user,
            'deposit': deposit,
            'usd_amount': usd_amount,
            'site_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000'),
        }
        
        # Render email templates
        html_content = render_to_string('emails/deposit_confirmed.html', context)
        text_content = render_to_string('emails/deposit_confirmed.txt', context)
        
        # Create email subject
        subject = f"QFS Ledger - Deposit Confirmed (#{deposit.id})"
        
        # Create email message
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user_email],
        )
        
        # Attach HTML version
        email.attach_alternative(html_content, "text/html")
        
        # Send email
        email.send()
        
        # Mark email as sent and update confirmed_at if not set
        deposit.email_sent = True
        if not deposit.confirmed_at:
            deposit.confirmed_at = timezone.now()
        deposit.save(update_fields=['email_sent', 'confirmed_at'])
        
        logger.info(f"Deposit confirmation email sent successfully to {user_email} for deposit {deposit.id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send deposit confirmation email for deposit {deposit.id}: {str(e)}")
        return False


def send_bulk_deposit_confirmation_emails(deposits: list[DepositTransaction]) -> dict:
    """
    Send confirmation emails for multiple deposits.
    
    Args:
        deposits: List of DepositTransaction instances to send emails for
        
    Returns:
        dict: Results summary with success/failure counts
    """
    results = {
        'total': len(deposits),
        'success': 0,
        'failed': 0,
        'skipped': 0,
        'errors': []
    }
    
    for deposit in deposits:
        try:
            if deposit.email_sent:
                results['skipped'] += 1
                continue
                
            if send_deposit_confirmation_email(deposit):
                results['success'] += 1
            else:
                results['failed'] += 1
                
        except Exception as e:
            results['failed'] += 1
            results['errors'].append(f"Deposit {deposit.id}: {str(e)}")
            logger.error(f"Error processing deposit {deposit.id}: {str(e)}")
    
    logger.info(f"Bulk email results: {results['success']} sent, {results['failed']} failed, {results['skipped']} skipped")
    return results


def send_wallet_copy_notification(tracking_record) -> bool:
    """
    Send notification to admins when a user copies a wallet address.
    
    Args:
        tracking_record: WalletCopyTracking instance
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Use the specific admin email from settings (already authorized with Mailgun)
        admin_email = getattr(settings, 'ADMIN_EMAIL', 'bornorbang@gmail.com')
        
        if not admin_email:
            logger.warning("No admin email address configured for wallet copy notification")
            return False
        
        # Prepare email context
        context = {
            'user': tracking_record.user,
            'coin_type': tracking_record.get_coin_type_display(),
            'wallet_address': tracking_record.wallet_address,
            'ip_address': tracking_record.ip_address,
            'user_agent': tracking_record.user_agent,
            'copied_at': tracking_record.copied_at,
            'admin_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000') + '/admin',
        }
        
        # Create email subject
        subject = f'[QFS Ledger] Wallet Address Copied - {tracking_record.user.username}'
        
        # Render email templates
        html_content = render_to_string('emails/wallet_copy_notification.html', context)
        text_content = render_to_string('emails/wallet_copy_notification.txt', context)
        
        # Create email message
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@qfsledger.com'),
            to=[admin_email],  # Send to single admin email
        )
        email.attach_alternative(html_content, "text/html")
        
        # Send email
        email.send()
        
        logger.info(f"Wallet copy notification sent to {admin_email} for user {tracking_record.user.username}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send wallet copy notification: {str(e)}")
        return False