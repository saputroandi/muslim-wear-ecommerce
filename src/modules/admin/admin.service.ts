import { Injectable } from "@nestjs/common";

@Injectable()
export class AdminService {
  getDashboardData(): {
    appName: string;
    title: string;
    intro: string;
    starterScopes: string[];
  } {
    return {
      appName: process.env.APP_NAME ?? "Muslim Wear Ecommerce",
      title: "Admin Dashboard Starter",
      intro:
        "Halaman ini adalah pondasi operasional single-admin. Logika roadmap (auth, order flow, promo, dll) belum diimplementasikan.",
      starterScopes: [
        "Modul domain terpisah untuk evolusi bertahap",
        "Koneksi PostgreSQL via TypeORM",
        "Endpoint health check dan API placeholder",
        "View layer starter dengan style dark-first dari DESIGN.md"
      ]
    };
  }
}

