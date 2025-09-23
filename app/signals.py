from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import DepositTransaction, Notification, Wallet


@receiver(post_save, sender=DepositTransaction)
def handle_deposit_status_change(sender, instance, created, **kwargs):
    """
    Handle deposit status changes: create notification, credit wallet, set timestamps
    """
    if not created:  # Only for updates, not new creations
        # Check if status changed to confirmed
        if instance.status == 'confirmed':
            print(f"DEBUG: Processing confirmed deposit #{instance.id} for user {instance.user.username}")
            
            # Check if notification already exists for this deposit
            existing_notification = Notification.objects.filter(
                user=instance.user,
                type='deposit_confirmed',
                title__contains=f"Deposit #{instance.id}"
            ).first()
            
            if not existing_notification:
                print(f"DEBUG: Creating notification for deposit #{instance.id}")
                # Create new notification
                Notification.objects.create(
                    user=instance.user,
                    type='deposit_confirmed',
                    title=f'Deposit #{instance.id} Confirmed',
                    message=f'Your {instance.get_coin_type_display()} deposit of {instance.amount:.2f} has been confirmed and credited to your wallet.',
                    created_at=timezone.now()
                )
                
                # Credit user wallet
                if instance.amount and instance.amount > 0:
                    print(f"DEBUG: Crediting {instance.amount} {instance.coin_type} to user {instance.user.username}")
                    wallet, wallet_created = Wallet.objects.get_or_create(user=instance.user)
                    print(f"DEBUG: Wallet {'created' if wallet_created else 'found'} for user {instance.user.username}")
                    
                    # Get balance before
                    old_balance = wallet.get_balance(instance.coin_type)
                    print(f"DEBUG: Old {instance.coin_type} balance: {old_balance}")
                    
                    # Add balance
                    wallet.add_balance(instance.coin_type, instance.amount)
                    
                    # Get balance after
                    new_balance = wallet.get_balance(instance.coin_type)
                    print(f"DEBUG: New {instance.coin_type} balance: {new_balance}")
                else:
                    print(f"DEBUG: No amount to credit for deposit #{instance.id}")
            else:
                print(f"DEBUG: Notification already exists for deposit #{instance.id}")
            
            # Send confirmation email if not already sent
            if not instance.email_sent:
                print(f"DEBUG: Sending confirmation email for deposit #{instance.id}")
                from .email_services import send_deposit_confirmation_email
                email_sent = send_deposit_confirmation_email(instance)
                if email_sent:
                    print(f"DEBUG: Email sent successfully for deposit #{instance.id}")
                else:
                    print(f"DEBUG: Failed to send email for deposit #{instance.id}")
            else:
                print(f"DEBUG: Email already sent for deposit #{instance.id}")
            
            # Set confirmed_at timestamp if not already set
            if not instance.confirmed_at:
                print(f"DEBUG: Setting confirmed_at timestamp for deposit #{instance.id}")
                # Use update to avoid triggering signals again
                DepositTransaction.objects.filter(id=instance.id).update(confirmed_at=timezone.now())