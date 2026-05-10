import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Página não encontrada</p>
        <Link to="/" className="mt-6 inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground">Voltar</Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Bet Control" },
      { name: "description", content: "Controle suas apostas esportivas." },
      { property: "og:title", content: "Bet Control" },
      { name: "twitter:title", content: "Bet Control" },
      { property: "og:description", content: "Controle suas apostas esportivas." },
      { name: "twitter:description", content: "Controle suas apostas esportivas." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8c47509a-1442-4742-bc90-476d1f12b6d0/id-preview-e37b2164--4ce0038a-84e7-42ed-9b16-85ac02655f1d.lovable.app-1778053737442.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8c47509a-1442-4742-bc90-476d1f12b6d0/id-preview-e37b2164--4ce0038a-84e7-42ed-9b16-85ac02655f1d.lovable.app-1778053737442.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => <Outlet />,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>
        {children}
        <Toaster theme="dark" />
        <Scripts />
      </body>
    </html>
  );
}
