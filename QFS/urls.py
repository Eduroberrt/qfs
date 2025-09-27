
"""
URL configuration for QFS project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.shortcuts import render
from django.views.static import serve
import os

def serve_nextjs_app(request, path=""):
    """Serve the appropriate Next.js HTML file for a given path"""
    try:
        # Remove leading slash if present
        if path.startswith('/'):
            path = path[1:]
        
        # If empty path, serve homepage
        if not path:
            return render(request, 'index.html')
        
        # Try to serve the specific HTML file for this route
        # Next.js export creates dashboard.html, profile.html, etc.
        html_file = f"{path}.html"
        
        # Check if the HTML file exists in the static files
        import os
        from django.conf import settings
        file_path = os.path.join(settings.STATIC_ROOT, html_file)
        
        if os.path.exists(file_path):
            return render(request, html_file)
        
        # Fallback to index.html for client-side routing
        return render(request, 'index.html')
        
    except Exception as e:
        return HttpResponse(f"Error loading Next.js app: {e}<br>Path: {request.path}")

def serve_nextjs_static(request, path):
    """Serve Next.js static files from staticfiles directory"""
    from django.http import Http404
    from django.utils._os import safe_join
    
    # The path already excludes the _next prefix, so we need to add it back
    # to look in the right directory structure
    full_path = f"_next/{path}"
    file_path = safe_join(settings.STATIC_ROOT, full_path)
    
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return serve(request, full_path, document_root=settings.STATIC_ROOT)
    else:
        # Debug info for troubleshooting
        debug_info = f"File not found: {file_path}\nStatic root: {settings.STATIC_ROOT}\nRequested path: {path}"
        raise Http404(f"Static file not found\n{debug_info}")

def serve_images(request, path):
    """Serve image files and other assets from staticfiles directory"""
    from django.http import Http404
    from django.utils._os import safe_join
    import os
    
    # Try multiple possible locations for images
    possible_paths = [
        path,  # Direct path
        f"images/{path}",  # In images directory
        f"assets/{path}",  # In assets directory
        f"static/{path}",  # In static subdirectory
        f"_next/static/media/{path}",  # Next.js media directory
    ]
    
    for possible_path in possible_paths:
        file_path = safe_join(settings.STATIC_ROOT, possible_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return serve(request, possible_path, document_root=settings.STATIC_ROOT)
    
    # If not found in any location, provide debug info
    debug_info = f"Image not found in any location\nStatic root: {settings.STATIC_ROOT}\nTried paths: {possible_paths}"
    raise Http404(f"Image file not found\n{debug_info}")

def get_token_views():
    """Lazy import for JWT token views"""
    from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
    return TokenObtainPairView, TokenRefreshView

def token_obtain_pair_view(request):
    """Wrapper for TokenObtainPairView"""
    TokenObtainPairView, _ = get_token_views()
    return TokenObtainPairView.as_view()(request)

def token_refresh_view(request):
    """Wrapper for TokenRefreshView"""
    _, TokenRefreshView = get_token_views()
    return TokenRefreshView.as_view()(request)

urlpatterns = [
    # Django Admin and API first (highest priority)
    path('admin/', admin.site.urls),
    path('api/', include('app.urls')),
    path('api/token/', token_obtain_pair_view, name='token_obtain_pair'),
    path('api/token/refresh/', token_refresh_view, name='token_refresh'),

    # Serve Next.js static files
    re_path(r'^_next/(?P<path>.*)$', serve_nextjs_static, name='nextjs_static'),
    
    # Serve images and assets
    re_path(r'^images/(?P<path>.*)$', serve_images, name='serve_images'),
    re_path(r'^assets/(?P<path>.*)$', serve_images, name='serve_assets'),
    
    # Serve Next.js app for all other routes EXCEPT Django paths
    # Use negative lookahead to exclude admin, api, _next, static, media, images, assets
    re_path(r'^(?!(?:admin|api|_next|static|media|images|assets)(?:/|$))(?P<path>.*)$', serve_nextjs_app, name='nextjs_app'),
]

# Add static files URL patterns for production
if settings.DEBUG or getattr(settings, 'USE_STATIC_FILE_HANDLER', False):
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
