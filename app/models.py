from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
import os


def kyc_document_upload_path(instance, filename):
    """Generate upload path for KYC documents"""
    return f'kyc_documents/{instance.user.id}/{filename}'


class KYCVerification(models.Model):
    """KYC Verification Status and Documents"""
    STATUS_CHOICES = [
        ('not_submitted', 'Not Submitted'),
        ('pending', 'Pending Review'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    
    DOCUMENT_TYPES = [
        ('passport', 'Passport'),
        ('drivers_license', "Driver's License"),
        ('national_id', 'National ID Card'),
        ('utility_bill', 'Utility Bill'),
        ('bank_statement', 'Bank Statement'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='kyc_verification')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_submitted')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, blank=True, null=True)
    document_file = models.FileField(upload_to=kyc_document_upload_path, blank=True, null=True)
    admin_notes = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='kyc_reviews')
    
    class Meta:
        verbose_name = "KYC Verification"
        verbose_name_plural = "KYC Verifications"
    
    def __str__(self):
        return f"{self.user.username} - {self.status}"

class Account(models.Model):
    """Chart of Accounts"""
    ACCOUNT_TYPES = [
        ('ASSET', 'Asset'),
        ('LIABILITY', 'Liability'),
        ('EQUITY', 'Equity'),
        ('REVENUE', 'Revenue'),
        ('EXPENSE', 'Expense'),
    ]
    
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.code} - {self.name}"

class Transaction(models.Model):
    """Ledger Transactions"""
    reference = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    date = models.DateField()
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.reference} - {self.description}"

class JournalEntry(models.Model):
    """Double Entry Journal Entries"""
    ENTRY_TYPES = [
        ('DEBIT', 'Debit'),
        ('CREDIT', 'Credit'),
    ]
    
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='entries')
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    entry_type = models.CharField(max_length=10, choices=ENTRY_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    
    def __str__(self):
        return f"{self.account.code} - {self.entry_type} - {self.amount}"


class SupportTicket(models.Model):
    """Support Ticket System"""
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'), 
        ('waiting_for_user', 'Waiting for User'),
        ('closed', 'Closed'),
    ]
    
    DEPARTMENT_CHOICES = [
        ('technical', 'Technical Support'),
        ('billing', 'Billing & Payments'),
        ('account', 'Account Issues'),
        ('kyc', 'KYC & Verification'),
        ('trading', 'Trading Support'),
        ('general', 'General Inquiry'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    ticket_id = models.CharField(max_length=20, unique=True)  # ST-XXXXX format
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='support_tickets')
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Support Ticket"
        verbose_name_plural = "Support Tickets"
    
    def __str__(self):
        return f"{self.ticket_id} - {self.subject}"
    
    def save(self, *args, **kwargs):
        if not self.ticket_id:
            # Generate ticket ID: ST-00001 format
            last_ticket = SupportTicket.objects.order_by('-id').first()
            if last_ticket:
                last_id = int(last_ticket.ticket_id.split('-')[1])
                new_id = last_id + 1
            else:
                new_id = 1
            self.ticket_id = f"ST-{new_id:05d}"
        super().save(*args, **kwargs)


class SupportReply(models.Model):
    """Support Ticket Replies"""
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='replies')
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Can be user or admin
    message = models.TextField()
    is_internal = models.BooleanField(default=False)  # Internal admin notes
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name = "Support Reply"
        verbose_name_plural = "Support Replies"
    
    def __str__(self):
        return f"{self.ticket.ticket_id} - Reply by {self.user.username}"


class Notification(models.Model):
    """User Notifications"""
    TYPE_CHOICES = [
        ('support_ticket', 'Support Ticket'),
        ('support_reply', 'Support Reply'),
        ('kyc_update', 'KYC Update'),
        ('account_update', 'Account Update'),
        ('deposit_confirmed', 'Deposit Confirmed'),
        ('general', 'General'),
        ('system', 'System'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    support_ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            from django.utils import timezone
            self.read_at = timezone.now()
            self.save()


class DepositTransaction(models.Model):
    """Deposit Transaction Model for handling cryptocurrency deposits"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('rejected', 'Rejected'),
    ]
    
    COIN_CHOICES = [
        ('bitcoin', 'Bitcoin (BTC)'),
        ('ethereum', 'Ethereum (ETH)'),
        ('ripple', 'Ripple (XRP)'),
        ('stellar', 'Stellar (XLM)'),
        ('usdt', 'Tether (USDT)'),
        ('bnb', 'BNB (BNB)'),
        ('bnb_tiger', 'BNB Tiger'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='deposit_transactions')
    coin_type = models.CharField(max_length=20, choices=COIN_CHOICES)
    amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, help_text="Deposit amount in USD")
    wallet_address = models.CharField(max_length=255)  # Generated wallet address for user
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True, null=True)
    email_sent = models.BooleanField(default=False)  # Track if confirmation email was sent
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_deposits')
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Deposit Transaction"
        verbose_name_plural = "Deposit Transactions"
    
    def __str__(self):
        amount_str = f"{self.amount} {self.get_coin_type_display()}" if self.amount else "Amount pending"
        return f"{self.user.username} - {amount_str} - {self.status}"


class Wallet(models.Model):
    """User Wallet Model for tracking cryptocurrency balances in USD"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    # Store balances in USD equivalent (2 decimal places for currency)
    bitcoin_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="Bitcoin balance in USD")
    ethereum_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="Ethereum balance in USD")
    ripple_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="Ripple balance in USD")
    stellar_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="Stellar balance in USD")
    usdt_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="USDT balance in USD")
    bnb_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="BNB balance in USD")
    bnb_tiger_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="BNB Tiger balance in USD")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "User Wallet"
        verbose_name_plural = "User Wallets"
    
    def __str__(self):
        return f"{self.user.username} - Wallet"
    
    def get_balance(self, coin_type):
        """Get balance for a specific coin type"""
        balance_field = f"{coin_type}_balance"
        return getattr(self, balance_field, 0)
    
    def add_balance(self, coin_type, amount):
        """Add amount to specific coin balance"""
        balance_field = f"{coin_type}_balance"
        current_balance = getattr(self, balance_field, 0)
        setattr(self, balance_field, current_balance + amount)
        self.save()
    
    def subtract_balance(self, coin_type, amount):
        """Subtract amount from specific coin balance"""
        balance_field = f"{coin_type}_balance"
        current_balance = getattr(self, balance_field, 0)
        if current_balance >= amount:
            setattr(self, balance_field, current_balance - amount)
            self.save()
            return True
        return False


class WalletCopyTracking(models.Model):
    """Track when users copy wallet addresses"""
    COIN_CHOICES = [
        ('bitcoin', 'Bitcoin (BTC)'),
        ('ethereum', 'Ethereum (ETH)'),
        ('ripple', 'Ripple (XRP)'),
        ('stellar', 'Stellar (XLM)'),
        ('usdt', 'Tether (USDT)'),
        ('bnb', 'BNB (BNB)'),
        ('bnb_tiger', 'BNB Tiger'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wallet_copy_events')
    coin_type = models.CharField(max_length=20, choices=COIN_CHOICES)
    wallet_address = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True, null=True)
    copied_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-copied_at']
        verbose_name = "Wallet Copy Event"
        verbose_name_plural = "Wallet Copy Events"
    
    def __str__(self):
        return f"{self.user.username} copied {self.get_coin_type_display()} address at {self.copied_at}"
