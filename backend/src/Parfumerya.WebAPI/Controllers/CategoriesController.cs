using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Parfumerya.Application.Common.Models;
using Parfumerya.Application.Features.Categories.Commands;
using Parfumerya.Application.Features.Categories.DTOs;
using Parfumerya.Application.Features.Categories.Queries;

namespace Parfumerya.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CategoriesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<CategoryDto>>>> GetAll([FromQuery] bool tree = true)
    {
        var result = await _mediator.Send(new GetCategoriesQuery(tree));
        return Ok(ApiResponse<List<CategoryDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<Guid>>> Create([FromBody] CreateCategoryRequest request)
    {
        var id = await _mediator.Send(new CreateCategoryCommand(request));
        return Ok(ApiResponse<Guid>.Ok(id));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<object>>> Update(Guid id, [FromBody] UpdateCategoryRequest request)
    {
        await _mediator.Send(new UpdateCategoryCommand(request with { Id = id }));
        return Ok(ApiResponse<object>.Ok(null!));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
    {
        await _mediator.Send(new DeleteCategoryCommand(id));
        return Ok(ApiResponse<object>.Ok(null!));
    }
}
