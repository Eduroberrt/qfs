from rest_framework import serializers
from .models import Account, Transaction, JournalEntry, KYCVerification, DepositTransaction, Wallet


class KYCVerificationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    document_file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = KYCVerification
        fields = [
            'id', 'user', 'user_name', 'user_email', 'status', 
            'document_type', 'document_file', 'document_file_url',
            'admin_notes', 'submitted_at', 'reviewed_at', 'reviewed_by'
        ]
        read_only_fields = ['user', 'submitted_at', 'reviewed_at', 'reviewed_by']
    
    def get_document_file_url(self, obj):
        if obj.document_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.document_file.url)
        return None


class KYCSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for KYC document submission by users"""
    class Meta:
        model = KYCVerification
        fields = ['document_type', 'document_file']
    
    def validate_document_file(self, value):
        """Validate file type and size"""
        if value:
            # Check file size (5MB limit)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("File size cannot exceed 5MB")
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError("Only JPG, PNG, GIF, and PDF files are allowed")
        
        return value


class KYCStatusSerializer(serializers.ModelSerializer):
    """Simple serializer for KYC status checks"""
    class Meta:
        model = KYCVerification
        fields = ['status', 'document_type', 'submitted_at', 'reviewed_at', 'admin_notes']

class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = '__all__'

class JournalEntrySerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    account_code = serializers.CharField(source='account.code', read_only=True)
    
    class Meta:
        model = JournalEntry
        fields = ['id', 'account', 'account_name', 'account_code', 'entry_type', 'amount']

class TransactionSerializer(serializers.ModelSerializer):
    entries = JournalEntrySerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Transaction
        fields = ['id', 'reference', 'description', 'date', 'user', 'user_name', 'entries', 'created_at']


class DepositTransactionSerializer(serializers.ModelSerializer):
    """Serializer for DepositTransaction with formatted amount"""
    coin_display = serializers.CharField(source='get_coin_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    amount = serializers.SerializerMethodField()
    
    class Meta:
        model = DepositTransaction
        fields = [
            'id', 'coin_type', 'coin_display', 'amount', 'wallet_address',
            'status', 'status_display', 'admin_notes', 'created_at'
        ]
    
    def get_amount(self, obj):
        """Format amount to 2 decimal places for display"""
        if obj.amount is not None:
            return f"{float(obj.amount):.2f}"
        return None


class WalletSerializer(serializers.ModelSerializer):
    """Serializer for user wallet balances"""
    bitcoin_balance = serializers.SerializerMethodField()
    ethereum_balance = serializers.SerializerMethodField()
    ripple_balance = serializers.SerializerMethodField()
    stellar_balance = serializers.SerializerMethodField()
    usdt_balance = serializers.SerializerMethodField()
    bnb_balance = serializers.SerializerMethodField()
    bnb_tiger_balance = serializers.SerializerMethodField()
    
    class Meta:
        model = Wallet
        fields = [
            'bitcoin_balance', 'ethereum_balance', 'ripple_balance', 
            'stellar_balance', 'usdt_balance', 'bnb_balance', 'bnb_tiger_balance'
        ]
    
    def get_bitcoin_balance(self, obj):
        return f"{float(obj.bitcoin_balance):.2f}"
    
    def get_ethereum_balance(self, obj):
        return f"{float(obj.ethereum_balance):.2f}"
    
    def get_ripple_balance(self, obj):
        return f"{float(obj.ripple_balance):.2f}"
    
    def get_stellar_balance(self, obj):
        return f"{float(obj.stellar_balance):.2f}"
    
    def get_usdt_balance(self, obj):
        return f"{float(obj.usdt_balance):.2f}"
    
    def get_bnb_balance(self, obj):
        return f"{float(obj.bnb_balance):.2f}"
    
    def get_bnb_tiger_balance(self, obj):
        return f"{float(obj.bnb_tiger_balance):.2f}"