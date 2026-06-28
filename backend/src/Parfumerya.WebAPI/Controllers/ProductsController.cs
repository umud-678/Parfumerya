using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Parfumerya.Application.Common.Models;
using Parfumerya.Application.Features.Products.Commands;
using Parfumerya.Application.Features.Products.DTOs;
using Parfumerya.Application.Features.Products.Queries;

namespace Parfumerya.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProductsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PaginatedList<ProductListDto>>>> GetAll([FromQuery] ProductFilterRequest filter)
    {
        var result = await _mediator.Send(new GetProductsQuery(filter));
        return Ok(ApiResponse<PaginatedList<ProductListDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<ProductDetailDto>>> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetProductByIdQuery(id));
        return Ok(ApiResponse<ProductDetailDto>.Ok(result));
    }

    [HttpGet("slug/{slug}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<ProductDetailDto>>> GetBySlug(string slug)
    {
        var result = await _mediator.Send(new GetProductBySlugQuery(slug));
        return Ok(ApiResponse<ProductDetailDto>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<Guid>>> Create([FromBody] CreateProductRequest request)
    {
        var id = await _mediator.Send(new CreateProductCommand(request));
        return Ok(ApiResponse<Guid>.Ok(id, "Product created"));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<object>>> Update(Guid id, [FromBody] UpdateProductRequest request)
    {
        await _mediator.Send(new UpdateProductCommand(request with { Id = id }));
        return Ok(ApiResponse<object>.Ok(null!, "Product updated"));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
    {
        await _mediator.Send(new DeleteProductCommand(id));
        return Ok(ApiResponse<object>.Ok(null!, "Product deleted"));
    }
}
