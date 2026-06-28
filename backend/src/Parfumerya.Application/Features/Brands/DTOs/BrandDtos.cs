namespace Parfumerya.Application.Features.Brands.DTOs;

public record BrandDto(Guid Id, string Name, string Slug, string? Description, string? LogoUrl);
public record CreateBrandRequest(string Name, string Slug, string? Description, string? LogoUrl);
public record UpdateBrandRequest(Guid Id, string Name, string Slug, string? Description, string? LogoUrl);
