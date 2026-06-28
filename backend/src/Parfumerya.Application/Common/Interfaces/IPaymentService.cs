namespace Parfumerya.Application.Common.Interfaces;

public interface IPaymentService
{
    Task<PaymentResult> InitiatePaymentAsync(PaymentRequest request, CancellationToken cancellationToken = default);
    Task<PaymentResult> HandleWebhookAsync(string payload, CancellationToken cancellationToken = default);
}

public record PaymentRequest(
    Guid OrderId,
    decimal Amount,
    string Currency,
    string ReturnUrl,
    string CallbackUrl);

public record PaymentResult(
    bool Success,
    string? TransactionId,
    string? RedirectUrl,
    string? ErrorMessage);
