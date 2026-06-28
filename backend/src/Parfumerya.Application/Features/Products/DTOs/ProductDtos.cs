namespace Parfumerya.Application.Features.Products.DTOs;

public record ProductVariantDto(
    Guid? Id,
    string SKU,
    int VolumeMl,
    decimal Price,
    decimal? DiscountPercent,
    int StockQuantity,
    int LowStockThreshold);

public record ProductImageDto(Guid? Id, string Url, bool IsPrimary, int SortOrder);

public record CreateProductRequest(
    string Name,
    string Slug,
    string? Description,
    string? Ingredients,
    Guid CategoryId,
    Guid BrandId,
    bool IsFeatured,
    bool IsNew,
    List<ProductVariantDto> Variants,
    List<ProductImageDto> Images);

public record UpdateProductRequest(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? Ingredients,
    Guid CategoryId,
    Guid BrandId,
    bool IsFeatured,
    bool IsNew,
    List<ProductVariantDto> Variants,
    List<ProductImageDto> Images);

public record ProductListDto(
    Guid Id,
    string Name,
    string Slug,
    string? PrimaryImageUrl,
    string BrandName,
    string CategoryName,
    decimal MinPrice,
    decimal? MaxPrice,
    decimal? AverageRating,
    bool IsFeatured,
    bool IsNew);

public record ProductDetailDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? Ingredients,
    string BrandName,
    Guid BrandId,
    string CategoryName,
    Guid CategoryId,
    bool IsFeatured,
    bool IsNew,
    decimal? AverageRating,
    int ReviewCount,
    List<ProductVariantDto> Variants,
    List<ProductImageDto> Images);

public record ProductFilterRequest(
    string? Search,
    Guid? CategoryId,
    Guid? BrandId,
    decimal? MinPrice,
    decimal? MaxPrice,
    double? MinRating,
    string? SortBy,
    bool SortDescending,
    int PageNumber = 1,
    int PageSize = 12);
