using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Parfumerya.Application.Common.Models;
using Parfumerya.Application.Features.Brands.Commands;
using Parfumerya.Application.Features.Brands.DTOs;
using Parfumerya.Application.Features.Brands.Queries;

namespace Parfumerya.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BrandsController : ControllerBase
{
    private readonly IMediator _mediator;

    public BrandsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<BrandDto>>>> GetAll()
    {
        var result = await _mediator.Send(new GetBrandsQuery());
        return Ok(ApiResponse<List<BrandDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<Guid>>> Create([FromBody] CreateBrandRequest request)
    {
        var id = await _mediator.Send(new CreateBrandCommand(request));
        return Ok(ApiResponse<Guid>.Ok(id));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<object>>> Update(Guid id, [FromBody] UpdateBrandRequest request)
    {
        await _mediator.Send(new UpdateBrandCommand(request with { Id = id }));
        return Ok(ApiResponse<object>.Ok(null!));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
    {
        await _mediator.Send(new DeleteBrandCommand(id));
        return Ok(ApiResponse<object>.Ok(null!));
    }
}
