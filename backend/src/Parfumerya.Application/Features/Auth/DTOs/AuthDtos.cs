namespace Parfumerya.Application.Features.Auth.DTOs;

public record RegisterRequest(string FullName, string Email, string Password, string? Phone);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string AccessToken, string RefreshToken, string UserId, string Email, string FullName, IEnumerable<string> Roles);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
