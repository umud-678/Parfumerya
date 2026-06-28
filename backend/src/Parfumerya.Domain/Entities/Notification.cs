using Parfumerya.Domain.Common;
using Parfumerya.Domain.Enums;

namespace Parfumerya.Domain.Entities;

public class Notification : BaseEntity
{
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public string? ReferenceId { get; set; }
}
