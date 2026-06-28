using MediatR;
using Parfumerya.Application.Common.Interfaces;
using Parfumerya.Application.Features.Auth.DTOs;

namespace Parfumerya.Application.Features.Auth.Commands;

public record RegisterCommand(RegisterRequest Request) : IRequest<AuthResponse>;
public record LoginCommand(LoginRequest Request) : IRequest<AuthResponse>;

public class RegisterCommandHandler(IIdentityService identityService)
    : IRequestHandler<RegisterCommand, AuthResponse>
{
    public Task<AuthResponse> Handle(RegisterCommand command, CancellationToken cancellationToken) =>
        identityService.RegisterAsync(command.Request, cancellationToken);
}

public class LoginCommandHandler(IIdentityService identityService)
    : IRequestHandler<LoginCommand, AuthResponse>
{
    public Task<AuthResponse> Handle(LoginCommand command, CancellationToken cancellationToken) =>
        identityService.LoginAsync(command.Request, cancellationToken);
}
