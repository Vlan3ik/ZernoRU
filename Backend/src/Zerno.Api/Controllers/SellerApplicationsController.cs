using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Portal;
using Zerno.Domain.Users;
using Zerno.Infrastructure.Persistence;

namespace Zerno.Api.Controllers;

[ApiController]
[Route("api/seller-applications")]
public sealed class SellerApplicationsController(
    AppDbContext dbContext,
    ICurrentUserContext currentUserContext) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<SellerApplicationDto>> List(CancellationToken cancellationToken)
        => await dbContext.SellerApplications
            .OrderByDescending(x => x.SubmittedAtUtc)
            .Select(x => new SellerApplicationDto(x.Id, x.UserId, x.Inn, x.Ogrn, x.CompanyName, x.DocPhotoUrl, x.Status.ToString(), x.SubmittedAtUtc.ToString("O")))
            .ToListAsync(cancellationToken);

    [HttpPost]
    public async Task<ActionResult<SellerApplicationDto>> Create([FromBody] CreateSellerApplicationRequest request, CancellationToken cancellationToken)
    {
        if (currentUserContext.UserId is not { } userId)
        {
            return Unauthorized();
        }

        var existing = await dbContext.SellerApplications
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.SubmittedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (existing is not null && existing.Status == SellerVerificationStatus.Pending)
        {
            return Conflict(new { message = "Заявка уже на проверке." });
        }

        var user = await dbContext.Users.FirstAsync(x => x.Id == userId, cancellationToken);
        var application = new SellerApplication
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Inn = request.Inn,
            Ogrn = request.Ogrn,
            CompanyName = request.CompanyName,
            DocPhotoUrl = request.DocPhotoUrl,
            Status = SellerVerificationStatus.Pending,
            SubmittedAtUtc = DateTime.UtcNow,
            CreatedAtUtc = DateTime.UtcNow
        };

        user.Inn = request.Inn;
        user.Ogrn = request.Ogrn;
        user.Role = UserRole.Seller;
        user.SellerVerificationStatus = SellerVerificationStatus.Pending;
        user.IsVerifiedSeller = false;

        dbContext.SellerApplications.Add(application);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new SellerApplicationDto(application.Id, application.UserId, application.Inn, application.Ogrn, application.CompanyName, application.DocPhotoUrl, application.Status.ToString(), application.SubmittedAtUtc.ToString("O")));
    }

    [HttpPatch("{applicationId:guid}/approve")]
    public async Task<IActionResult> Approve(Guid applicationId, CancellationToken cancellationToken)
    {
        if (!await IsAdminAsync(cancellationToken))
        {
            return Unauthorized();
        }

        var application = await dbContext.SellerApplications.FirstOrDefaultAsync(x => x.Id == applicationId, cancellationToken);
        if (application is null)
        {
            return NotFound();
        }

        application.Status = SellerVerificationStatus.Approved;
        var user = await dbContext.Users.FirstAsync(x => x.Id == application.UserId, cancellationToken);
        user.IsVerifiedSeller = true;
        user.SellerVerificationStatus = SellerVerificationStatus.Approved;
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<bool> IsAdminAsync(CancellationToken cancellationToken)
    {
        if (currentUserContext.UserId is not { } userId)
        {
            return false;
        }

        return await dbContext.Users.AnyAsync(x => x.Id == userId && x.Role == UserRole.Admin, cancellationToken);
    }
}

public sealed record CreateSellerApplicationRequest(string Inn, string Ogrn, string CompanyName, string DocPhotoUrl);
