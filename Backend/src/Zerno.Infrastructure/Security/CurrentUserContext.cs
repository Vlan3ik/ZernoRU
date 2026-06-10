using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Zerno.Application.Abstractions;

namespace Zerno.Infrastructure.Security;

public sealed class CurrentUserContext(IHttpContextAccessor accessor) : ICurrentUserContext
{
    public Guid? UserId
    {
        get
        {
            var httpContext = accessor.HttpContext;
            var claimValue = httpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(claimValue, out var claimUserId))
            {
                return claimUserId;
            }

            var headerValue = httpContext?.Request.Headers["X-User-Id"].ToString();
            if (Guid.TryParse(headerValue, out var headerUserId))
            {
                return headerUserId;
            }

            return null;
        }
    }
}
