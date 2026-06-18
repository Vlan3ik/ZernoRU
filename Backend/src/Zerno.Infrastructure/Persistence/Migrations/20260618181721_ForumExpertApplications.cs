using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zerno.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ForumExpertApplications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ForumExpertApplications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserName = table.Column<string>(type: "text", nullable: false),
                    Section = table.Column<string>(type: "text", nullable: false),
                    TopicId = table.Column<Guid>(type: "uuid", nullable: true),
                    Specialization = table.Column<string>(type: "text", nullable: false),
                    ExperienceYears = table.Column<int>(type: "integer", nullable: false),
                    ExperienceSummary = table.Column<string>(type: "text", nullable: false),
                    Proof = table.Column<string>(type: "text", nullable: false),
                    Contact = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ReviewedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReviewerName = table.Column<string>(type: "text", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ForumExpertApplications", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ForumExpertApplications_Status",
                table: "ForumExpertApplications",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ForumExpertApplications_UserId",
                table: "ForumExpertApplications",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ForumExpertApplications");
        }
    }
}
