using MediatR;
using Microsoft.EntityFrameworkCore;
using Parfumerya.Application.Common.Interfaces;
using Parfumerya.Application.Features.Categories.DTOs;

namespace Parfumerya.Application.Features.Categories.Queries;

public record GetCategoriesQuery(bool Tree = true) : IRequest<List<CategoryDto>>;

public class GetCategoriesQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCategoriesQuery, List<CategoryDto>>
{
    public async Task<List<CategoryDto>> Handle(GetCategoriesQuery query, CancellationToken cancellationToken)
    {
        var categories = await context.Categories
            .OrderBy(c => c.SortOrder)
            .ToListAsync(cancellationToken);

        if (!query.Tree)
        {
            return categories.Select(c => new CategoryDto(
                c.Id, c.Name, c.Slug, c.Description, c.ImageUrl, c.ParentId, c.SortOrder, [])).ToList();
        }

        return BuildTree(categories, null);
    }

    private static List<CategoryDto> BuildTree(List<Domain.Entities.Category> all, Guid? parentId)
    {
        return all
            .Where(c => c.ParentId == parentId)
            .Select(c => new CategoryDto(
                c.Id, c.Name, c.Slug, c.Description, c.ImageUrl, c.ParentId, c.SortOrder,
                BuildTree(all, c.Id)))
            .ToList();
    }
}
