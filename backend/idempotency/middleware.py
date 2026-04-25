class IdempotencyHeaderMiddleware:
    """Attaches Idempotency-Key to request for convenience (core logic lives in views)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.idempotency_key = request.headers.get("Idempotency-Key")
        return self.get_response(request)
