using Parfumerya.Domain.Common;

namespace Parfumerya.Domain.Entities;

public class SiteSetting : BaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}
