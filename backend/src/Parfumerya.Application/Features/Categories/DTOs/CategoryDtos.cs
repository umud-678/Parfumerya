namespace Parfumerya.Application.Features.Categories.DTOs;

public record CategoryDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? ImageUrl,
    Guid? ParentId,
    int SortOrder,
    List<CategoryDto> Children);

public record CreateCategoryRequest(string Name, string Slug, string? Description, string? ImageUrl, Guid? ParentId, int SortOrder);
public record UpdateCategoryRequest(Guid Id, string Name, string Slug, string? Description, string? ImageUrl, Guid? ParentId, int SortOrder);
