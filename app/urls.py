from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'accounts', views.AccountViewSet)
router.register(r'transactions', views.TransactionViewSet)
router.register(r'journal-entries', views.JournalEntryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('status/', views.api_status, name='api_status'),
    path('auth/register/', views.register_user, name='register_user'),
    path('auth/login/', views.login_user, name='login_user'),
    path('auth/profile/', views.user_profile, name='user_profile'),
    path('auth/change-password/', views.change_password, name='change_password'),
    path('auth/forgot-password/', views.forgot_password, name='forgot_password'),
    path('auth/reset-password/', views.reset_password, name='reset_password'),
    # KYC endpoints
    path('kyc/submit/', views.submit_kyc_document, name='submit_kyc_document'),
    path('kyc/status/', views.kyc_status, name='kyc_status'),
    path('admin/kyc/', views.admin_kyc_list, name='admin_kyc_list'),
    path('admin/kyc/<int:kyc_id>/review/', views.admin_kyc_review, name='admin_kyc_review'),
    
    # Support endpoints
    path('support/create/', views.create_support_ticket, name='create_support_ticket'),
    path('support/tickets/', views.get_user_support_tickets, name='get_user_support_tickets'),
    path('support/admin/tickets/', views.get_all_support_tickets, name='admin_support_tickets'),
    path('support/admin/reply/', views.admin_reply_to_support_ticket, name='admin_reply_to_support_ticket'),
    
    # Notification endpoints
    path('notifications/', views.get_user_notifications, name='get_user_notifications'),
    path('notifications/mark-read/', views.mark_notification_read, name='mark_notification_as_read'),
    path('notifications/mark-all-read/', views.mark_all_notifications_read, name='mark_all_notifications_as_read'),
    
    # Deposit endpoints
    path('deposits/wallet-address/', views.get_wallet_address, name='get_wallet_address'),
    path('deposits/create/', views.create_deposit, name='create_deposit'),
    path('deposits/', views.get_user_deposits, name='get_user_deposits'),
    
    # Wallet endpoints
    path('wallet/balance/', views.get_wallet_balance, name='get_wallet_balance'),
    path('wallet/track-copy/', views.track_wallet_copy, name='track_wallet_copy'),
]