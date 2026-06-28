using Microsoft.AspNetCore.Identity;
using Parfumerya.Application.Common.Interfaces;
using Parfumerya.Application.Features.Auth.DTOs;
using Parfumerya.Infrastructure.Identity;

namespace Parfumerya.Infrastructure.Services;

public class IdentityService : IIdentityService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtTokenService _jwtTokenService;

    public IdentityService(UserManager<ApplicationUser> userManager, IJwtTokenService jwtTokenService)
    {
        _userManager = userManager;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            PhoneNumber = request.Phone,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new Application.Common.Exceptions.ValidationException(
                result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description }));

        await _userManager.AddToRoleAsync(user, AppRoles.Customer);

        return await BuildAuthResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email)
            ?? throw new Application.Common.Exceptions.NotFoundException("User", request.Email);

        if (user.IsBlocked)
            throw new Application.Common.Exceptions.ForbiddenException("Account is blocked.");

        if (!await _userManager.CheckPasswordAsync(user, request.Password))
            throw new Application.Common.Exceptions.ValidationException(
                new Dictionary<string, string[]> { ["password"] = ["Invalid credentials."] });

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        return await BuildAuthResponse(user);
    }

    private async Task<AuthResponse> BuildAuthResponse(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtTokenService.GenerateAccessToken(user.Id, user.Email!, roles);
        var refresh = _jwtTokenService.GenerateRefreshToken();
        return new AuthResponse(token, refresh, user.Id, user.Email!, user.FullName, roles);
    }
}
