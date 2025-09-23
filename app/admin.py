from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.contrib import messages
from django.db.models import Q
from django import forms
from .models import Account, Transaction, JournalEntry, KYCVerification, SupportTicket, SupportReply, Notification, DepositTransaction, Wallet, WalletCopyTracking
from .email_services import send_deposit_confirmation_email, send_bulk_deposit_confirmation_emails

@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'account_type', 'is_active']
    list_filter = ['account_type', 'is_active']
    search_fields = ['code', 'name']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['reference', 'description', 'date', 'user', 'created_at']
    list_filter = ['date', 'user']
    search_fields = ['reference', 'description']

@admin.register(KYCVerification)
class KYCVerificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'status', 'document_type', 'submitted_at', 'reviewed_at', 'reviewed_by']
    list_filter = ['status', 'document_type', 'submitted_at']
    search_fields = ['user__username', 'user__email', 'user__first_name']
    readonly_fields = ['submitted_at', 'reviewed_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'status')
        }),
        ('Document Information', {
            'fields': ('document_type', 'document_file')
        }),
        ('Timestamps', {
            'fields': ('submitted_at',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(self.readonly_fields)
        if obj:  # Editing existing object
            readonly_fields.extend(['user', 'document_type', 'document_file'])
        return readonly_fields
    
    def save_model(self, request, obj, form, change):
        if change and 'status' in form.changed_data:
            # If status is being changed, record the reviewer
            if obj.status in ['verified', 'rejected']:
                from django.utils import timezone
                obj.reviewed_at = timezone.now()
                obj.reviewed_by = request.user
        super().save_model(request, obj, form, change)


class SupportReplyInline(admin.TabularInline):
    model = SupportReply
    extra = 1
    fields = ['user', 'message', 'is_internal', 'created_at']
    readonly_fields = ['created_at']


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_id', 'user', 'department', 'subject', 'status', 'priority', 'assigned_to', 'created_at']
    list_filter = ['status', 'department', 'priority', 'assigned_to', 'created_at']
    search_fields = ['ticket_id', 'user__username', 'user__email', 'subject', 'message']
    readonly_fields = ['ticket_id', 'created_at', 'updated_at']
    inlines = [SupportReplyInline]
    
    fieldsets = (
        ('Ticket Information', {
            'fields': ('ticket_id', 'user', 'subject', 'message')
        }),
        ('Classification', {
            'fields': ('department', 'status', 'priority', 'assigned_to')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'closed_at')
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(self.readonly_fields)
        if obj:  # Editing existing object
            readonly_fields.extend(['user', 'department', 'subject', 'message'])
        return readonly_fields
    
    def save_model(self, request, obj, form, change):
        if change and 'status' in form.changed_data:
            if obj.status == 'closed':
                obj.closed_at = timezone.now()
            elif obj.status != 'closed':
                obj.closed_at = None
        super().save_model(request, obj, form, change)


@admin.register(SupportReply)
class SupportReplyAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'user', 'is_internal', 'created_at']
    list_filter = ['is_internal', 'created_at', 'user']
    search_fields = ['ticket__ticket_id', 'user__username', 'message']
    readonly_fields = ['created_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'type', 'title', 'is_read', 'created_at']
    list_filter = ['type', 'is_read', 'created_at']
    search_fields = ['user__username', 'user__email', 'title', 'message']
    readonly_fields = ['created_at', 'read_at']
    
    fieldsets = (
        ('Notification Information', {
            'fields': ('user', 'type', 'title', 'message')
        }),
        ('Status', {
            'fields': ('is_read', 'support_ticket')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'read_at')
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(self.readonly_fields)
        if obj:  # Editing existing object
            readonly_fields.extend(['user', 'type', 'support_ticket'])
        return readonly_fields


class DepositTransactionForm(forms.ModelForm):
    """Custom form for DepositTransaction to remove placeholder"""
    class Meta:
        model = DepositTransaction
        fields = '__all__'
        widgets = {
            'amount': forms.NumberInput(attrs={'placeholder': ''}),
        }


@admin.register(DepositTransaction)
class DepositTransactionAdmin(admin.ModelAdmin):
    form = DepositTransactionForm
    list_display = ['user', 'coin_type', 'amount_formatted', 'status', 'email_sent_status', 'created_at']
    list_filter = ['coin_type', 'status', 'email_sent', 'created_at']
    search_fields = ['user__username', 'user__email', 'wallet_address']
    readonly_fields = ['created_at', 'wallet_address', 'email_sent']
    actions = ['confirm_deposits_and_send_emails', 'send_confirmation_emails']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'coin_type')
        }),
        ('Transaction Details', {
            'fields': ('amount', 'status', 'created_at')
        }),
        ('Email Status', {
            'fields': ('email_sent',)
        }),
    )
    
    def amount_formatted(self, obj):
        """Display amount with 2 decimal places"""
        if obj.amount is not None:
            return f"{float(obj.amount):.2f}"
        return "Not set"
    amount_formatted.short_description = "Amount"
    
    def email_sent_status(self, obj):
        """Display email sent status with colors"""
        if obj.email_sent:
            return format_html('<span style="color: green;">✅ Sent</span>')
        else:
            return format_html('<span style="color: red;">❌ Not Sent</span>')
    email_sent_status.short_description = "Email Status"
    
    def wallet_address_short(self, obj):
        """Display shortened wallet address"""
        if obj.wallet_address:
            return f"{obj.wallet_address[:10]}...{obj.wallet_address[-8:]}"
        return "Not set"
    wallet_address_short.short_description = "Wallet Address"
    
    def confirm_deposits_and_send_emails(self, request, queryset):
        """Admin action to confirm deposits and send notification emails"""
        # Filter for pending deposits only
        pending_deposits = queryset.filter(status='pending')
        
        if not pending_deposits.exists():
            self.message_user(request, "No pending deposits selected.", messages.WARNING)
            return
        
        confirmed_count = 0
        email_results = {'success': 0, 'failed': 0, 'errors': []}
        
        for deposit in pending_deposits:
            # Confirm the deposit
            deposit.status = 'confirmed'
            deposit.confirmed_at = timezone.now()
            deposit.processed_by = request.user
            deposit.save()
            confirmed_count += 1
            
            # Send confirmation email
            if send_deposit_confirmation_email(deposit):
                email_results['success'] += 1
            else:
                email_results['failed'] += 1
                email_results['errors'].append(f"Deposit #{deposit.id}")
        
        # Show success message
        message = f"Successfully confirmed {confirmed_count} deposit(s). "
        message += f"Emails sent: {email_results['success']}, failed: {email_results['failed']}"
        
        if email_results['errors']:
            message += f". Failed emails for: {', '.join(email_results['errors'])}"
            self.message_user(request, message, messages.WARNING)
        else:
            self.message_user(request, message, messages.SUCCESS)
    
    confirm_deposits_and_send_emails.short_description = "Confirm selected deposits and send emails"
    
    def send_confirmation_emails(self, request, queryset):
        """Admin action to send confirmation emails for confirmed deposits"""
        confirmed_deposits = queryset.filter(status='confirmed', email_sent=False)
        
        if not confirmed_deposits.exists():
            self.message_user(request, "No confirmed deposits without emails selected.", messages.WARNING)
            return
        
        results = send_bulk_deposit_confirmation_emails(list(confirmed_deposits))
        
        message = f"Email results: {results['success']} sent, {results['failed']} failed, {results['skipped']} skipped"
        
        if results['errors']:
            message += f". Errors: {'; '.join(results['errors'])}"
            self.message_user(request, message, messages.WARNING)
        else:
            self.message_user(request, message, messages.SUCCESS)
    
    send_confirmation_emails.short_description = "Send confirmation emails for confirmed deposits"
    
    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(self.readonly_fields)
        if obj:  # Editing existing object
            readonly_fields.extend(['user', 'coin_type'])
        return readonly_fields
    
    def save_model(self, request, obj, form, change):
        if change and 'status' in form.changed_data:
            # If status is being changed, record the admin who processed it
            if obj.status in ['confirmed', 'rejected']:
                obj.processed_by = request.user
                if obj.status == 'confirmed' and not obj.confirmed_at:
                    obj.confirmed_at = timezone.now()
                    
                # Send email if deposit is confirmed and email not sent yet
                if obj.status == 'confirmed' and not obj.email_sent:
                    if send_deposit_confirmation_email(obj):
                        messages.success(request, f"Confirmation email sent to {obj.user.email}")
                    else:
                        messages.warning(request, f"Failed to send confirmation email to {obj.user.email}")
                        
        super().save_model(request, obj, form, change)


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'bitcoin_balance_formatted', 'ethereum_balance_formatted', 'ripple_balance_formatted', 'stellar_balance_formatted', 'usdt_balance_formatted', 'bnb_balance_formatted', 'bnb_tiger_balance_formatted', 'updated_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Balances', {
            'fields': ('bitcoin_balance', 'ethereum_balance', 'ripple_balance', 'stellar_balance', 'usdt_balance', 'bnb_balance', 'bnb_tiger_balance')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def bitcoin_balance_formatted(self, obj):
        return f"{float(obj.bitcoin_balance):.4f}"
    bitcoin_balance_formatted.short_description = "Bitcoin Balance"
    
    def ethereum_balance_formatted(self, obj):
        return f"{float(obj.ethereum_balance):.4f}"
    ethereum_balance_formatted.short_description = "Ethereum Balance"
    
    def ripple_balance_formatted(self, obj):
        return f"{float(obj.ripple_balance):.4f}"
    ripple_balance_formatted.short_description = "Ripple Balance"
    
    def stellar_balance_formatted(self, obj):
        return f"{float(obj.stellar_balance):.4f}"
    stellar_balance_formatted.short_description = "Stellar Balance"
    
    def usdt_balance_formatted(self, obj):
        return f"{float(obj.usdt_balance):.4f}"
    usdt_balance_formatted.short_description = "USDT Balance"
    
    def bnb_balance_formatted(self, obj):
        return f"{float(obj.bnb_balance):.4f}"
    bnb_balance_formatted.short_description = "BNB Balance"
    
    def bnb_tiger_balance_formatted(self, obj):
        return f"{float(obj.bnb_tiger_balance):.4f}"
    bnb_tiger_balance_formatted.short_description = "BNB Tiger Balance"
    
    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(self.readonly_fields)
        if obj:  # Editing existing object
            readonly_fields.append('user')
        return readonly_fields


@admin.register(WalletCopyTracking)
class WalletCopyTrackingAdmin(admin.ModelAdmin):
    """Admin interface for Wallet Copy Tracking"""
    list_display = [
        'user_info', 'coin_type_display', 'wallet_address_short', 
        'ip_address', 'copied_at_formatted', 'user_agent_short'
    ]
    list_filter = ['coin_type', 'copied_at', 'ip_address']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name', 'wallet_address', 'ip_address']
    readonly_fields = ['user', 'coin_type', 'wallet_address', 'ip_address', 'user_agent', 'copied_at']
    ordering = ['-copied_at']
    date_hierarchy = 'copied_at'
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Copy Details', {
            'fields': ('coin_type', 'wallet_address', 'copied_at')
        }),
        ('Technical Information', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
    )
    
    def user_info(self, obj):
        """Display user information with link to user admin"""
        user_name = f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
        return format_html(
            '<a href="/admin/auth/user/{}/change/" target="_blank">{}</a><br><small>{}</small>',
            obj.user.id,
            user_name,
            obj.user.email
        )
    user_info.short_description = "User"
    user_info.admin_order_field = 'user__username'
    
    def coin_type_display(self, obj):
        """Display coin type with icon"""
        coin_icons = {
            'bitcoin': '₿',
            'ethereum': 'Ξ',
            'ripple': '◉',
            'stellar': '✦',
            'usdt': '₮',
            'bnb': '🟡',
            'bnb_tiger': '🐅'
        }
        icon = coin_icons.get(obj.coin_type, '🪙')
        return format_html(
            '<span style="font-size: 16px;">{}</span> {}',
            icon,
            obj.get_coin_type_display()
        )
    coin_type_display.short_description = "Cryptocurrency"
    coin_type_display.admin_order_field = 'coin_type'
    
    def wallet_address_short(self, obj):
        """Display shortened wallet address"""
        if obj.wallet_address:
            short_address = f"{obj.wallet_address[:8]}...{obj.wallet_address[-8:]}"
            return format_html(
                '<span title="{}" style="font-family: monospace; background: #f0f0f0; padding: 2px 4px; border-radius: 3px;">{}</span>',
                obj.wallet_address,
                short_address
            )
        return "N/A"
    wallet_address_short.short_description = "Wallet Address"
    
    def copied_at_formatted(self, obj):
        """Display formatted copy timestamp"""
        local_time = timezone.localtime(obj.copied_at)
        return format_html(
            '<span title="{}">{}</span>',
            local_time.strftime('%Y-%m-%d %H:%M:%S %Z'),
            local_time.strftime('%b %d, %Y %H:%M')
        )
    copied_at_formatted.short_description = "Copied At"
    copied_at_formatted.admin_order_field = 'copied_at'
    
    def user_agent_short(self, obj):
        """Display shortened user agent"""
        if obj.user_agent:
            # Extract browser info from user agent
            user_agent = obj.user_agent
            if 'Chrome' in user_agent:
                browser = '🌐 Chrome'
            elif 'Firefox' in user_agent:
                browser = '🦊 Firefox'
            elif 'Safari' in user_agent:
                browser = '🧭 Safari'
            elif 'Edge' in user_agent:
                browser = '🌊 Edge'
            else:
                browser = '🌐 Browser'
            
            return format_html(
                '<span title="{}">{}</span>',
                user_agent[:100] + '...' if len(user_agent) > 100 else user_agent,
                browser
            )
        return "Unknown"
    user_agent_short.short_description = "Browser"
    
    def has_add_permission(self, request):
        """Disable manual creation of copy tracking records"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Make records read-only"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Allow deletion for cleanup purposes"""
        return request.user.is_superuser
