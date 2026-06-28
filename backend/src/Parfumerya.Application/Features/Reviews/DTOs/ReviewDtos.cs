namespace Parfumerya.Application.Features.Reviews.DTOs;

public record ReviewDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string UserId,
    string UserName,
    int Rating,
    string? Comment,
    bool IsApproved,
    bool IsHidden,
    DateTime CreatedAt);

public record CreateReviewRequest(Guid ProductId, int Rating, string? Comment);
public record ReviewFilterRequest(Guid? ProductId, string? UserId, DateTime? FromDate, DateTime? ToDate, bool? IsApproved, int PageNumber = 1, int PageSize = 20);
