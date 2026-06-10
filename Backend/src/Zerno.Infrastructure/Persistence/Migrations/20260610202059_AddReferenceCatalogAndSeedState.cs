using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zerno.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReferenceCatalogAndSeedState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PortalSeedStates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    AppliedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PortalSeedStates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReferenceCatalogItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Region = table.Column<string>(type: "text", nullable: false),
                    Summary = table.Column<string>(type: "text", nullable: false),
                    Details = table.Column<string>(type: "text", nullable: false),
                    Contacts = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Highlights = table.Column<string>(type: "text", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferenceCatalogItems", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PortalSeedStates_Name",
                table: "PortalSeedStates",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReferenceCatalogItems_Category_Slug",
                table: "ReferenceCatalogItems",
                columns: new[] { "Category", "Slug" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PortalSeedStates");

            migrationBuilder.DropTable(
                name: "ReferenceCatalogItems");
        }
    }
}
