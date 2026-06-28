using Parfumerya.Application.Common.Interfaces;

namespace Parfumerya.Infrastructure.Services;

/// <summary>
/// Mock payment service — real bank/Stripe integration replaces redirect + webhook flow.
/// Never store card numbers in the database.
/// </summary>
public class MockPaymentService : IPaymentService
{
    public Task<PaymentResult> InitiatePaymentAsync(PaymentRequest request, CancellationToken cancellationToken = default)
    {
        var transactionId = $"TXN-{Guid.NewGuid():N}"[..20];
        var redirectUrl = $"{request.ReturnUrl}?orderId={request.OrderId}&status=success&txn={transactionId}";

        return Task.FromResult(new PaymentResult(
            Success: true,
            TransactionId: transactionId,
            RedirectUrl: redirectUrl,
            ErrorMessage: null));
    }

    public Task<PaymentResult> HandleWebhookAsync(string payload, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new PaymentResult(
            Success: true,
            TransactionId: $"WEBHOOK-{Guid.NewGuid():N}"[..20],
            RedirectUrl: null,
            ErrorMessage: null));
    }
}
