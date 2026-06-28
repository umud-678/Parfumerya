using MediatR;
using Microsoft.EntityFrameworkCore;
using Parfumerya.Application.Common.Interfaces;
using Parfumerya.Application.Features.Categories.DTOs;
using Parfumerya.Domain.Entities;

namespace Parfumerya.Application.Features.Categories.Commands;

public record CreateCategoryCommand(CreateCategoryRequest Request) : IRequest<Guid>;
public record UpdateCategoryCommand(UpdateCategoryRequest Request) : IRequest<Unit>;
public record DeleteCategoryCommand(Guid Id) : IRequest<Unit>;

public class CreateCategoryCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateCategoryCommand, Guid>
{
    public async Task<Guid> Handle(CreateCategoryCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        var category = new Category
        {
            Name = req.Name,
            Slug = req.Slug,
            Description = req.Description,
            ImageUrl = req.ImageUrl,
            ParentId = req.ParentId,
            SortOrder = req.SortOrder
        };
        context.Categories.Add(category);
        await context.SaveChangesAsync(cancellationToken);
        return category.Id;
    }
}

public class UpdateCategoryCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateCategoryCommand, Unit>
{
    public async Task<Unit> Handle(UpdateCategoryCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        var category = await context.Categories.FindAsync([req.Id], cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException(nameof(Category), req.Id);

        category.Name = req.Name;
        category.Slug = req.Slug;
        category.Description = req.Description;
        category.ImageUrl = req.ImageUrl;
        category.ParentId = req.ParentId;
        category.SortOrder = req.SortOrder;
        category.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

public class DeleteCategoryCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteCategoryCommand, Unit>
{
    public async Task<Unit> Handle(DeleteCategoryCommand command, CancellationToken cancellationToken)
    {
        var category = await context.Categories
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Id == command.Id, cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException(nameof(Category), command.Id);

        if (category.Children.Any(c => !c.IsDeleted))
            throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
            {
                ["category"] = ["Cannot delete category with active subcategories."]
            });

        var hasProducts = await context.Products.AnyAsync(p => p.CategoryId == command.Id, cancellationToken);
        if (hasProducts)
            throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
            {
                ["category"] = ["Cannot delete category with linked products."]
            });

        category.IsDeleted = true;
        category.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
