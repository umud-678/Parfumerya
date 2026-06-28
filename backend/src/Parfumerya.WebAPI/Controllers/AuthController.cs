using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Parfumerya.Application.Common.Models;
using Parfumerya.Application.Features.Auth.Commands;
using Parfumerya.Application.Features.Auth.DTOs;

namespace Parfumerya.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator) => _mediator = mediator;

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Register([FromBody] RegisterRequest request)
    {
        var result = await _mediator.Send(new RegisterCommand(request));
        return Ok(ApiResponse<AuthResponse>.Ok(result, "Registration successful"));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request)
    {
        var result = await _mediator.Send(new LoginCommand(request));
        return Ok(ApiResponse<AuthResponse>.Ok(result, "Login successful"));
    }
}
