using Parfumerya.Domain.Enums;

namespace Parfumerya.Application.Features.Coupons.DTOs;

public record CouponDto(
    Guid Id,
    string Code,
    DiscountType DiscountType,
    decimal Value,
    DateTime StartDate,
    DateTime EndDate,
    int? UsageLimit,
    int UsedCount,
    decimal? MinOrderAmount,
    Guid? ProductId,
    bool IsActive);

public record CreateCouponRequest(
    string Code,
    DiscountType DiscountType,
    decimal Value,
    DateTime StartDate,
    DateTime EndDate,
    int? UsageLimit,
    decimal? MinOrderAmount,
    Guid? ProductId);
