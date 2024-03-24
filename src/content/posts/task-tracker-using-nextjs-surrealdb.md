---
draft: false

date: 2024-01-21
title: "Task tracker application using NextJS and SurrealDB"
author: Sourab Pramanik

tags: [nextjs, surrealdb, next-auth, guide]

share:
  image: https://someimage.jpg
  title: "Task tracker application using NextJS and SurrealDB"
  description: "Simple task tracking app to explore SurrealDB features with NextJS"

---
In this article, I have shared how I have built a simple task-tracking full-stack application using [**NextJS**](https://nextjs.org/) and [**SurrealDB**](https://surrealdb.com/). 

I wanted to explore SurrealDB and all of its features by building this task-tracking application. In this application, all the tasks can be stored, fetched, updated, and deleted in the SurrealDB. On top of it, I have also used **[NextAuth](https://next-auth.js.org/)** to authenticate users and store the user records in SurrealDB. 

All these features can be achieved using any database but I specifically used SurrealDB to test their **[Live Query](https://docs.surrealdb.com/docs/nightly/integration/sdks/javascript#live)** feature and [**SurrealQL**](https://docs.surrealdb.com/docs/nightly/surrealql/overview) which is their query language. 

SurrealQL is just like SQL with similar syntax but with a better approach to writing query statements which is very straightforward. Especially when writing statements for creating relations between records is very easy and intuitive. They use graph relations to relate the records which is very interesting to me.

The Live Query feature helps get real-time updates whenever a CREATE, UPDATE, or DELETE event is triggered. 

Interesting right!!

## Setup SurrealDB server

There are many ways you can install and run SurrealDB server based on your operating system so please check the [documentation](https://docs.surrealdb.com/docs/installation/overview). I am going to use Docker to run the SurrealDB server for this project.

To run SurrealDB server using docker you first need docker to be installed in your machine so check the process of [installation](https://docs.docker.com/engine/install/). 

Run the below command to run the SurrealDB server on port **8000.**

```bash
docker run --rm --pull always -p 8000:8000 -u root surrealdb/surrealdb:latest start --auth --user root --pass root file:/container-dir/dev.db
```

> This command will run the server which will have a database with the name **dev**, the username of the admin is **root** and the password is also **root**
> 

After the server has successfully started you will see this in your terminal window.


![terminal screenshot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7fjm1xyhaqiz9lckry8g.png)

## Project setup

### Install and configure NextJS application

Run this command to create a new NextJS application

```bash
npx create-next-app@latest task-tracker --typescript --tailwind --eslint
```

Configure your application by selecting these options when prompted

```bash
Would you like to use `src/` directory? No
Would you like to use App Router? (recommended) Yes
Would you like to customize the default import alias (@/*)? Yes
What import alias would you like configured? @/*
```

And go inside the project

```bash
cd task-tracker
```

### Install and configure Shandcn UI

I have used [Shadcn UI](https://ui.shadcn.com/docs) in this project for creating components. I like Shadcn UI because it offers lots of components with minimal setup, great looking elements and uses Tailwind.

To setup Shadcn UI run the below command

```bash
npx shadcn-ui@latest init
```

Configure Shadcn by selecting these options when prompted

```bash
Would you like to use TypeScript (recommended)? yes
Which style would you like to use? › Default
Which color would you like to use as base color? › Slate
Where is your global CSS file? › › app/globals.css
Do you want to use CSS variables for colors? › yes
Are you using a custom tailwind prefix eg. tw-? (Leave blank if not) ...
Where is your tailwind.config.js located? › tailwind.config.ts
Configure the import alias for components: › @/components
Configure the import alias for utils: › @/lib/utils
Are you using React Server Components? › yes
```

### Add components from Shadcn

Runs these commands to add all the components I have used in this project

```bash
npx shadcn-ui@latest add form button avatar dropdown-menu sonner table badge checkbox command popover separator select radio-group 
```

### Install JavaScript SDK for SurrealDB

Run this below command to install JavaScript SDK for SurrealDB

```bash
npm install --save surrealdb.js
```

### Install NextAuth

I am using [NextAuth](https://next-auth.js.org/getting-started/introduction) to create and authenticate the users with the help of GitHub, Google, and Email providers. It has a wide range of authentication providers and since it is an open-source project I use it for most of my projects.

Run the below command to install NextAuth in your application

```bash
npm install next-auth
```

### Install SurrealDB adapter for NextAuth

[Adapters](https://authjs.dev/getting-started/adapters) are used to connect your databases to NextAuth so that we don’t have to write any queries to store or access user data during authentication process. NextAuth will create a non-existing user in our database and creates a session for the user.

Run the below command to install the adapter

```bash
npm install @auth/surrealdb-adapter
```

### Install other required packages

**[Zod](https://zod.dev/?id=introduction)** and `react-hook-form` are used to define schemas, validate user input in the forms, and handle form submissions.

```bash
npm install zod react-hook-form
```

To create the task table I have used `[@tanstack/react-table](https://tanstack.com/table/v8)` as it has many features like searching, pagination, sorting, and filtering. As it is a Headless table library it handles most of the complex tasks on its own.

```bash
npm install @tanstack/react-table
```

**Zustand** for global state management and syncing state during hydration

```tsx
npm install zustand
```

 **[SWR](https://swr.vercel.app/)** for client-side data fetching and revalidation. It has a good caching strategy.

```bash
npm i swr
```

[Nanoid](https://github.com/ai/nanoid#readme) for generation unique short ID

```bash
npm i nanoid
```

I have used **[Lucide icons](https://lucide.dev/)** for icons 

```bash
npm install lucide
```

[Next themes](https://github.com/pacocoursey/next-themes) is used for themes switching 

```bash
npm install next-themes
```

These are all the dependencies that I have used in this project.

## Connect NextJS application to SurrealDB server

Now we need to connect the NextJS application to the SurrealDB server instance running on port 8000. 

Create .env.local in the root of your project and add these variables

```bash
NEXT_PUBLIC_DB_CONNECTION_URL=http://localhost:8000
NEXT_PUBLIC_NAMESPACE=dev
NEXT_PUBLIC_DB_NAME=dev
NEXT_PUBLIC_DB_USER=root
NEXT_PUBLIC_DB_PASSWORD=root
```

> Make sure to use the same values you used for running the SurrealDB server
> 

Create `/app/api/lib/surreal.ts`

```tsx
import { Surreal } from "surrealdb.js";

const connectionString = process.env.NEXT_PUBLIC_DB_CONNECTION_URL as string;
const user = process.env.NEXT_PUBLIC_DB_USER as string;
const pass = process.env.NEXT_PUBLIC_DB_PASSWORD as string;
const ns = process.env.NEXT_PUBLIC_NAMESPACE as string;
const db = process.env.NEXT_PUBLIC_DB_NAME as string;

export const surrealDatabase = new Surreal();

export const surrealConnection = new Promise<Surreal>(async (resolve, reject) => {

    try {
        await surrealDatabase.connect(`${connectionString}/rpc`, {
            ns, db, auth: { user, pass }
        })
        resolve(surrealDatabase)
    } catch (e) {
        reject(e)
    }
});
```

That’s it the NextJS application is now connected to the SurrealDB server.

## Setup NextAuth in your application

### Setup GitHub for authentication

Create a new GitHub application for authentication and generate a **Client ID** and **Client Secret** by following this [documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps).

### Setup Google for authentication

Create a new project in the Google Cloud console for authentication and generate a **Client ID** and **Client Secret** by following this [documentation](https://console.developers.google.com/apis/credentials).

> Add **Authorized redirect URIs** 
For production: `https://{YOUR_DOMAIN}/api/auth/callback/google`
> 
> 
> For development: `http://localhost:3000/api/auth/callback/google`
> 

### Add the credential to .env.local

```tsx
NEXTAUTH_SECRET=gsfasd4234523dffsds21q1
NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_BASE_URL=http://localhost:3000

GOOGLE_CLIENT_ID=17855432281717-cor3fulo8g9gxxxxxxxxxxxvk775h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-YmfXBxxxxxxxxxxuctcpx0uoo

GITHUB_CLIENT_ID=6438xxxxxxxa0b
GITHUB_CLIENT_SECRET=d09d35bf86fcxxxxxxxxxxx498dc62690ad
```

### Create an authentication route handler

Create a new route handler which will be used by NextAuth to create and authenticate users. I have used the JWT strategy to validate user sessions

Add GitHub and Google providers by using the credentials generated earlier and also add an Email provider to let the users create and access their account using only their email address. 

> Usually when using Email provider we have to send a verification link to the users email address to verify the user if the user does not exists in our database. But in this case we will print the verification link in the terminal window to keep the process short.

I will create another article later on how to setup email provider to send verification links to user’s email address.
> 

Create `/app/api/auth/[…nextauth]/route.ts`

```tsx
import NextAuth, { AuthOptions, User } from "next-auth"

import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import { SurrealDBAdapter } from "@auth/surrealdb-adapter"
import { surrealConnection } from "../../lib/surreal";

export const authOptions: AuthOptions = {
    pages: {
        error: "/auth",
        signIn: '/auth',
    },
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
        EmailProvider({
            async sendVerificationRequest({ url }) {
                console.log(url);
            },
        }),
    ],
    adapter: SurrealDBAdapter(surrealConnection),
    session: { strategy: "jwt" },
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                domain: undefined,
                secure: false,
            },
        },
    },
    callbacks: {
        jwt: async ({ token, user }) => {
            if (!token.email) {
                return {};
            }
            if (user) {
                token.user = user;
            }
            return token;
        },
        session: async ({ session, token }) => {
            (session.user as User) = {
                id: token.sub,
                // @ts-ignore
                ...(token || session).user,
            };
            // console.log("session", session);
            return session;
        },
    },
};

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

You can see that I have used an option adapter and provided SurrealDB adapter which takes the connection configuration we created earlier so that now NextAuth can create, read, update, and delete users and manage their sessions.

Cool right!!

Create `/types/nextauth.d.ts` to update the Session interface used by NextAuth

```tsx
import NextAuth from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            email: string,
            name: string,
            image: string,
        }
    }
}
```

## Create authentication form

Create `/components/form/user-auth-form.tsx`

```tsx
"use client";

import * as React from "react";

import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { cn } from "@/lib/utils";
import { Github, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  Form,
} from "../ui/form";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  next: any;
}

const formSchema = z.object({
  email: z.string().min(2).max(50).email("Invalid email address"),
});

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoginWithEmail, setIsLoginWithEmail] =
    React.useState<boolean>(false);
  const [isLoginWithGithub, setIsLoginWithGithub] =
    React.useState<boolean>(false);
  const [isLoginWithGoogle, setIsLoginWithGoogle] =
    React.useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoginWithEmail(true);
    signIn("email", {
      email: values.email,
      redirect: false,
      ...(props.next && props.next.length > 0
        ? { callbackUrl: props.next }
        : {}),
    }).then((res) => {
      if (res?.ok && !res?.error) {
        toast.success("Check your terminal");
      } else {
        toast.error("Something went wrong");
      }
      setIsLoginWithEmail(false);
    });
  }

  function onLoginWithGoogle() {
    setIsLoginWithGoogle(true);
    signIn("google", {
      redirect: false,
      ...(props.next && props.next.length > 0
        ? { callbackUrl: props.next }
        : {}),
    })
      .then(() => {
        toast.success("Redirecting...");
      })
      .catch(() => {
        toast.error("Something went wrong.");
      })
      .finally(() => {
        setIsLoginWithGoogle(false);
      });
  }

  function onLoginWithGithub() {
    setIsLoginWithGithub(true);
    signIn("github", {
      redirect: false,
      ...(props.next && props.next.length > 0
        ? { callbackUrl: props.next }
        : {}),
    })
      .then(() => {
        toast.success("Redirecting...");
      })
      .catch(() => {
        toast.error("Something went wrong.");
      })
      .finally(() => {
        setIsLoginWithGoogle(false);
      });
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={isLoginWithEmail} className="w-full">
            {isLoginWithEmail && (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sign In with Email
          </Button>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button
        onClick={() => onLoginWithGoogle()}
        variant="outline"
        type="button"
        disabled={isLoginWithGoogle}
      >
        {isLoginWithGoogle ? (
          <Loader className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
            fill="currentColor"
            className="mr-2 h-4 w-4"
          >
            <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
          </svg>
        )}{" "}
        Google
      </Button>
      <Button
        onClick={() => onLoginWithGithub()}
        variant="outline"
        type="button"
        disabled={isLoginWithGithub}
      >
        {isLoginWithGithub ? (
          <Loader className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Github className="mr-2 h-4 w-4" />
        )}{" "}
        GitHub
      </Button>
    </div>
  );
}
```

Create a new route for the authentication page `/app/auth/page.tsx`

```tsx
import { Metadata } from "next";

import { UserAuthForm } from "@/components/forms/user-auth-form";
import { useParams } from "next/navigation";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
};

export default function AuthenticationPage() {
  const { next } = useParams as { next?: string };

  return (
    <>
      <div className="container relative h-screen flex items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Get Started
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email below to get started
            </p>
          </div>
          <UserAuthForm next={next} />
        </div>
      </div>
    </>
  );
}
```

## Protecting routes using middleware

Middleware is used to run any code before any requests or responses can be completed, make modifications to their headers, rewrite the response body, and redirect to another route. In this project  I have created a middleware to check if a user has a valid session then they are allowed to access protected routes like the task board page, create and edit task pages, or else they will be redirected to the login page.

Create `/lib/app-middleware.ts`

```tsx
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function AppMiddleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const token = (await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    })) as {
        email?: string;
        user?: {
            createdAt?: string;
        };
    };

    if (!token?.email && path !== "/auth") {
        return NextResponse.redirect(
            new URL(
                `/auth${path !== "/" ? `?next=${encodeURIComponent(path)}` : ""}`,
                req.url,
            ),
        );

        // if there's a token
    } else if (token?.email) {
        if (
            token?.user?.createdAt &&
            new Date(token?.user?.createdAt).getTime() > Date.now() - 10000 &&
            path !== "/"
        ) {
            return NextResponse.redirect(new URL("/", req.url));

        } else if (path === "/auth") {
            return NextResponse.redirect(new URL("/", req.url));
        }
    }
}
```

Create `/middleware.ts` and import AppMiddleware

```tsx
import { NextRequest } from "next/server";
import AppMiddleware from "./lib/app-middleware";

export const config = {
    matcher: [
        "/((?!api/|_next/|_proxy/|_auth/|_static|_vercel|favicon.ico|sitemap.xml).*)",
    ],
};

export default async function middleware(req: NextRequest) {

    return AppMiddleware(req);
}
```

## Use session provider to get user session on the client side

Create `/lib/provider/nextAuthSessionProvider.ts`

```tsx
"use client";
import React from "react";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

const NextAuthSessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <SessionProvider>{children}</SessionProvider>;
};
export default NextAuthSessionProvider;
```

Update `/app/layout.tsx` to use session provider wrapper

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import NextAuthSessionProvider from "@/lib/provider/nextAuthSessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
      </body>
    </html>
  );
}
```

## Create logout and theme toggle components

### Logout component using sign-out function from NextAuth

Create `/components/profile.tsx`

```tsx
"use client";

import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Profile() {
  const { data: session, status } = useSession();
  return (
    status === "authenticated" && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={session?.user?.image ?? ""}
                alt={session?.user?.name ?? ""}
              />
              <AvatarFallback>
                {session?.user?.name
                  ? session?.user?.name.slice(0, 2).toUpperCase()
                  : ""}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {session?.user?.name}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {session?.user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              signOut({
                callbackUrl: `${window.location.origin}`,
              })
            }
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  );
}
```

### Create theme toggle (optional)

Use `next-theme` to create a theme provider and wrap the root layout with it and then create a new toggle component to switch themes

Create `/lib/provider/theme-provider.tsx`

```tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

Create theme toggle `/components/theme-toggle.tsx`

```tsx
"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MoonIcon, SunIcon } from "lucide-react";

export default function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Add theming and logout feature to your application

Update `/app/layout.tsx` to use ThemeProvider and theme-toggle component

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/lib/provider/theme-provider";
import ThemeToggle from "@/components/theme-toggle";
import NextAuthSessionProvider from "@/lib/provider/nextAuthSessionProvider";
import Profile from "@/components/profile";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextAuthSessionProvider>
            <div className="fixed top-8 right-8 z-20 flex items-center gap-5">
              <Profile />
              <ThemeToggle />
            </div>
            <main className="bg-background text-foreground">{children}</main>
            <Toaster />
          </NextAuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

> To test the authentication is working, start the NextJS application using `npm run dev` command. It should run at port 3000 and open the URL in your browser.
> 

## Add schemas for the table in the database and keep our application type safe

Create `/lib/schema.ts`

```tsx
import { z } from "zod"

export function record<Table extends string = string>(table?: Table) {
    return z.custom<`${Table}:${string}`>(
        (val) =>
            typeof val === 'string' && table
                ? val.startsWith(table + ':')
                : true,
        {
            message: ['Must be a record', table && `Table must be: "${table}"`]
                .filter((a) => a)
                .join('; '),
        }
    );
}

export const taskSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(2, "Add a descriptive title"),
    description: z.string().optional(),
    status: z.enum(["todo", "inprogress", "canceled", "done"], {
        required_error: "You need to select a status.",
    }),
    label: z.enum(["bug", "feature", "documentation"], {
        required_error: "You need to select a label.",
    }),
    priority: z.enum(["high", "low", "moderate"], {
        required_error: "You need to set the priority.",
    }),
    author: record('user'),
})

export const userSchema = z.object({
    id: z.string().readonly(),
    name: z.string().optional().readonly(),
    email: z.string().readonly(),
    image: z.string().optional().readonly(),
})

export type Task = z.infer<typeof taskSchema>
export type User = z.infer<typeof userSchema>
```

> To set the author from the user table in the database for each task I have used a `record()` which creates a custom type using Zod and this was taken from SurrealDB’s example repo in [GitHub](https://github.com/surrealdb/examples/blob/main/notes-v2/src/lib/zod.ts)
> 

## Create task request route handlers

Create  `/app/api/task/route.ts` to create a new task and fetch all tasks

```tsx
import { Task } from "@/lib/schema";
import { surrealDatabase } from "../lib/surreal";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// Create new task
export async function POST(request: Request) {
    const payload = await request.json();
    const taskId = nanoid(5)
    const session = await getServerSession(authOptions);

    const response = await surrealDatabase.query<[Task]>(
        `CREATE task:${taskId} SET title='${payload.title}', description='${payload.description}', status='${payload.status}', label='${payload.label}', priority='${payload.priority}', author='user:${session?.user.id}';`
    );

    return NextResponse.json({
        success: true,
        data: response[0],
    });
}

// Fetch all tasks
export async function GET() {
    const response = await surrealDatabase.query<Task[]>(
        "SELECT * FROM type::table($tb);",
        {
            tb: "task",
        }
    );

    return NextResponse.json({
        success: true,
        data: response[0].result,
    });
}
```

Create `/app/api/task/[id]/route.ts`  to fetch, update, and delete tasks by the ID

```tsx
import { Task } from "@/lib/schema";
import { surrealDatabase } from "../../lib/surreal";
import { NextResponse } from "next/server";

// Fetch task by id
export async function GET(_: Request, { params }: { params: { id: string } }) {

    const response = await surrealDatabase.select<Task>(
        'task:' + params.id
    );

    return NextResponse.json({
        success: true,
        data: response[0],
    });
}

// Update task by id
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const payload = await request.json();

    const response = await surrealDatabase.merge<Task>(
        'task:' + params.id, payload
    );

    return NextResponse.json({
        success: true,
        data: response[0],
    });
}

// Delete task by id
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const response = await surrealDatabase.delete<Task>(
        'task:' + params.id
    );

    return NextResponse.json({
        success: true,
        data: response[0],
    });
}
```

## Create task API handlers

Create `/lib/task/handler.ts` to consume all the APIs created earlier and abstract away the internal working.

```tsx
import { Task } from "../schema";

const endpoint = process.env.NEXT_PUBLIC_BASE_URL + '/api/task'
// Create a new task
export const createTask = async (payload: Task) => {
    const res: {
        success: boolean;
        data?: Task;
    } = await (
        await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
    ).json();

    return res;
}

// Fetch all tasks
export const getAllTasks = async () => {
    const res: {
        success: boolean;
        data?: Task[];
    } = await (
        await fetch(endpoint)
    ).json();

    return res;
};

// Fetch task by id
export const getTaskById = async (id: string) => {
    const res: {
        success: boolean;
        data?: Task;
    } = await (
        await fetch(endpoint + "/" + id)
    ).json();

    return res;
};

// Update task by id
export const updateTaskById = async (id: string, payload: Task) => {
    console.log(id);

    const res: {
        success: boolean;
        data?: Task;
    } = await (
        await fetch(endpoint + "/" + id, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
    ).json();

    return res;
};

// Delete task by id
export const deleteTaskById = async (id: string) => {
    await fetch(endpoint + "/" + id, { method: "DELETE" })
};
```

## Create user request route handler

Create `/app/api/user/[id]/route.ts`  to fetch user by the ID

```tsx
import { User } from "@/lib/schema";
import { surrealDatabase } from "../../lib/surreal";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {

    const response = await surrealDatabase.select<User>(
        params.id
    );

    return NextResponse.json({
        success: true,
        data: response[0],
    });
}
```

## Create author API handler and hook

Create `/lib/author/handler.ts` this uses the user API created before.

```tsx
import { User } from "../schema";

const endpoint = process.env.NEXT_PUBLIC_BASE_URL + '/api/user'

export const getAuthorById = async (id: string) => {
    const res: {
        success: boolean;
        data?: User;
    } = await (
        await fetch(endpoint + "/" + id)
    ).json();

    return res;
};
```

Create `/lib/author/hook.ts` this uses the `getAuthorById` handler function as a fetcher in the `useSWR` hook. So that we can fetch user data on the client side and also cache the data.

```tsx
import useSWR from "swr";
import { getAuthorById } from "./handler";

export const useAuthor = (id: string) => {
    return useSWR(`/api/user/${id}`, async () => await getAuthorById(
        id
    ));
};
```

## Create a Zustand store to sync server and client-side

I have created a hook to read the state from the server on the client before hydration and synchronization between the server/client.

Create `/lib/store/zustand.ts` 

```tsx
import { StoreApi, UseBoundStore, create } from 'zustand'
import { useMemo, useRef } from 'react';

export const useStoreSync = <T>(
    useStore: UseBoundStore<StoreApi<T>>,
    state: T
): UseBoundStore<StoreApi<T>> => {
    const unsynced = useRef(true);
    const useServerStore = useMemo(() => create<T>(() => state), []);

    if (unsynced.current) {
        useStore.setState(state);
        unsynced.current = false;
    }
    return window !== undefined ? useStore : useServerStore;
};
```

## Setup SurrealDB Live Query using Zustand

I have created a Zustand store for tasks. In this store, the state will be updated whenever the task is CREATED, UPDATED, or DELETED. `live` function from SurrealDB SDK is used for listening to these events and for each event different state setters are called to update the state instantly.

Create `/lib/store/task.ts` 

```tsx
import { surrealDatabase } from '@/app/api/lib/surreal';
import { Task } from '../schema';
import { create } from 'zustand';

type TaskStore = {
    tasks: Task[],
    appendTask?: (newTasks: Task) => void,
    removeTask?: (newTask: Task) => void,
    updateTask?: (newTask: Task) => void,
}

export const useTaskStore = create<TaskStore>((set) => {
    const store = {
        tasks: [],
        appendTask: (newTask: Task) => set((state) => ({ tasks: [...state.tasks, newTask] })),
        removeTask: (removedTask: Task) => set((state) => ({
            tasks: state.tasks.reduce((arr: Task[], task) => {
                if (task.id !== removedTask.id) {
                    arr.push(task)
                }
                return arr
            }, [])
        })),
        updateTask: (modifiedTask: Task) => set((state) => ({
            tasks: state.tasks.reduce((arr: Task[], task) => {
                if (task.id === modifiedTask.id) {
                    arr.push(modifiedTask)
                } else {
                    arr.push(task)
                }
                return arr
            }, [])
        })),
    }

    surrealDatabase.live<Task>('task', ({ action, result }) => {
        switch (action) {
            case 'CREATE':
                store.appendTask(result);
                break;
            case 'DELETE':
                store.removeTask(result);
                break;
            case 'UPDATE':
                store.updateTask(result);
                break;

        }
    });
    return store;
});
```

## Create a task form and pages

Create `/components/forms/task-form` that can be reused in both create task and edit task page

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { Task, record, taskSchema } from "@/lib/schema";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { useState } from "react";
import { Loader, SquarePen } from "lucide-react";
import { createTask, updateTaskById } from "@/lib/task/handler";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface TaskFormProps {
  editRecord?: Task;
}

export function TaskForm(props: TaskFormProps) {
  const { editRecord } = props;

  const form = useForm<Task>({
    resolver: zodResolver(taskSchema),
    defaultValues: editRecord,
    mode: "onChange",
  });
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const router = useRouter();
  const { data: session } = useSession();

  async function onSubmit(data: Task) {
    setSubmitting(true);
    try {
      if (editRecord?.id) {
        await updateTaskById(editRecord.id.replace("task:", ""), data);
        toast.success("Task updated successfully!");
      } else {
        await createTask({
          ...data,
          author: record("user").parse("user:" + session?.user.id),
        });
        toast.success("Task created successfully!");
      }
    } catch (error) {
      console.log(error);
      toast.success("Something went wrong. Try again");
    } finally {
      setSubmitting(false);
      router.push("/");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a brief description about the task"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Select a status</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="todo" />
                    </FormControl>
                    <FormLabel className="font-normal">Todo</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="inprogress" />
                    </FormControl>
                    <FormLabel className="font-normal">Inprogress</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="done" />
                    </FormControl>
                    <FormLabel className="font-normal">Done</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="canceled" />
                    </FormControl>
                    <FormLabel className="font-normal">Cancel</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Select a label</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="bug" />
                    </FormControl>
                    <FormLabel className="font-normal">Bug</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="feature" />
                    </FormControl>
                    <FormLabel className="font-normal">Feature</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="documentation" />
                    </FormControl>
                    <FormLabel className="font-normal">Documentation</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Set priority for the task</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="high" />
                    </FormControl>
                    <FormLabel className="font-normal">High</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="moderate" />
                    </FormControl>
                    <FormLabel className="font-normal">Moderate</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="low" />
                    </FormControl>
                    <FormLabel className="font-normal">Low</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="float-end">
          {isSubmitting ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <SquarePen className="mr-2 h-4 w-4" />
          )}
          {editRecord?.id ? "Update task" : "Create task"}
        </Button>
      </form>
    </Form>
  );
}
```

Create `/components/nav-back.tsx`

 

```tsx
"use client";

import { ChevronLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "./ui/button";

const NavBack = () => {
  const router = useRouter();
  return (
    <div className="w-full flex items-center justify-start -ml-5 my-3">
      <Button onClick={() => router.back()} variant={"ghost"}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button onClick={() => router.push("/")} variant={"ghost"}>
        <Home className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default NavBack;
```

Create `/app/task/new/page.tsx`

```tsx
import { TaskForm } from "@/components/forms/task-form";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Create Task</h3>
        <p className="text-sm text-muted-foreground">
          Enter all the details below.
        </p>
      </div>
      <Separator />
      <TaskForm />
    </div>
  );
}
```

Create `/app/task/edit/[id]/page.tsx`

```tsx
import { TaskForm } from "@/components/forms/task-form";
import { Separator } from "@/components/ui/separator";
import { getTaskById } from "@/lib/task/handler";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function EditTaskPage({
  params,
}: {
  params: { id: string };
}) {
  const { data } = await getTaskById(params.id);
  const session = await getServerSession();

  if (!data || session?.user.id !== data.author.replace("user:", "")) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Edit Task:{params.id}</h3>
        <p className="text-sm text-muted-foreground">Edit the details below.</p>
      </div>
      <Separator />
      <TaskForm editRecord={data} />
    </div>
  );
}
```

> Here I have added extra check to allow authors to edit their created own tasks.
> 

## Build the table

### Create table components

Create column header `/components/task-table/column-header.tsx`

```tsx
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react";
import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

Create columns `/components/task-table/columns.tsx` to define the structure and content of each column

```tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../ui/badge";
import { labels, priorities, statuses } from "./data";
import { DataTableColumnHeader } from "./column-header";
import { DataTableRowActions } from "./row-actions";
import { Task } from "@/lib/schema";
import { Avatar, AvatarImage } from "../ui/avatar";
import { useAuthor } from "@/lib/author/hook";
import { Loader } from "lucide-react";

export const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "author",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Author" />
    ),
    cell: ({ row }) => {
      const userId = row.original.author as string;
      const { data, isLoading } = useAuthor(userId);

      return (
        <div className="w-[30px]">
          {isLoading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {data && (
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      data.data?.image ?? "https://avatar.vercel.sh/" + userId
                    }
                    alt={userId + " image"}
                  />
                </Avatar>
              )}
            </>
          )}
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Task" />
    ),
    cell: ({ row }) => <div className="w-[80px]">{row.getValue("id")}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      const label = labels.find((label) => label.value === row.original.label);

      return (
        <div className="flex space-x-2 w-[100px] lg:w-[500px]">
          {label && <Badge variant="outline">{label.label}</Badge>}
          <span className="max-w-[300px] truncate font-medium">
            {row.getValue("title")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue("status")
      );

      if (!status) {
        return null;
      }

      return (
        <div className="flex w-[100px] items-center">
          {status.icon && (
            <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          <span>{status.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const priority = priorities.find(
        (priority) => priority.value === row.getValue("priority")
      );

      if (!priority) {
        return null;
      }

      return (
        <div className="flex items-center">
          {priority.icon && (
            <priority.icon className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          <span>{priority.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
```

Create filter data `/components/task-table/data.ts` 

```tsx
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircle2,
  CircleIcon,
  XCircle,
  Timer,
} from "lucide-react";

export const labels = [
  {
    value: "bug",
    label: "Bug",
  },
  {
    value: "feature",
    label: "Feature",
  },
  {
    value: "documentation",
    label: "Documentation",
  },
];

export const statuses = [
  {
    value: "todo",
    label: "Todo",
    icon: CircleIcon,
  },
  {
    value: "in progress",
    label: "In Progress",
    icon: Timer,
  },
  {
    value: "done",
    label: "Done",
    icon: CheckCircle2,
  },
  {
    value: "canceled",
    label: "Canceled",
    icon: XCircle,
  },
];

export const priorities = [
  {
    label: "Low",
    value: "low",
    icon: ArrowDownIcon,
  },
  {
    label: "Medium",
    value: "medium",
    icon: ArrowRightIcon,
  },
  {
    label: "High",
    value: "high",
    icon: ArrowUpIcon,
  },
];
```

Create filter component `/components/task-table/faceted-filter.tsx`  to filter based on the task label, status, and priority

```tsx
import * as React from "react";
import { CheckIcon, PlusCircle } from "lucide-react";
import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  const selectedValues = new Set(column?.getFilterValue() as string[]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value);
                      } else {
                        selectedValues.add(option.value);
                      }
                      const filterValues = Array.from(selectedValues);
                      column?.setFilterValue(
                        filterValues.length ? filterValues : undefined
                      );
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckIcon className={cn("h-4 w-4")} />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                    {facets?.get(option.value) && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {facets.get(option.value)}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

Create row action component `/components/task-table/row-actions.tsx` to edit, delete and copy tasks

```tsx
"use client";

import { CopyPlusIcon, EditIcon, Loader, Trash2 } from "lucide-react";
import { Row } from "@tanstack/react-table";

import { Button } from "../ui/button";

import { Task, record, taskSchema } from "@/lib/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTask, deleteTaskById } from "@/lib/task/handler";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const task: Task = taskSchema.parse(row.original);
  const router = useRouter();
  const [isCopying, setCopying] = useState<boolean>(false);
  const [isDeleting, setDeleting] = useState<boolean>(false);
  const { data: session } = useSession();

  const isAuthor = task.author.replace("user:", "") === session?.user.id;

  const handleEditClick = () => {
    task.id && router.push("/task/edit/" + task.id.replace("task:", ""));
  };

  const handleCreateCopy = async () => {
    setCopying(true);
    try {
      await createTask({
        title: task.title,
        description: task.description,
        status: task.status,
        label: task.label,
        priority: task.priority,
        author: record("user").parse("user:" + session?.user.id),
      });
      toast.success("Created a copy successfully!");
    } catch (error) {
      console.log(error);
      toast.success("Failed to copy!");
    } finally {
      setCopying(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    if (task.id) {
      try {
        await deleteTaskById(task.id.replace("task:", ""));
        toast.success("Successfully deleted!");
      } catch (error) {
        console.log(error);
        toast.success("Failed to delete!");
      } finally {
        setDeleting(false);
      }
    } else {
      toast.success("Trouble deleting!");
    }
  };

  return (
    <div className="flex items-center">
      {isAuthor && (
        <Button variant={"ghost"} onClick={handleEditClick}>
          <EditIcon className="w-4 h-4" />
        </Button>
      )}
      {isAuthor && (
        <Button className="relative min-w-14" variant={"ghost"}>
          {isDeleting ? (
            <Loader className="w-4 h-4 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" onClick={handleDelete} />
          )}
        </Button>
      )}

      <Button className="relative min-w-14" variant={"ghost"}>
        {isCopying ? (
          <Loader className="w-4 h-4 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 animate-spin" />
        ) : (
          <CopyPlusIcon className="w-4 h-4" onClick={handleCreateCopy} />
        )}
      </Button>
    </div>
  );
}
```

Create pagination component `/components/task-table/table-pagination.tsx`

```tsx
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Table } from "@tanstack/react-table";

import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

Create table toolbar component `/components/task-table/table-toolbar.tsx`

```tsx
"use client";

import { Cross, Plus } from "lucide-react";
import { Table } from "@tanstack/react-table";

import { Button } from "../ui/button";
import { Input } from "../ui/input";

import { priorities, statuses } from "./data";
import { DataTableFacetedFilter } from "./faceted-filter";
import { useRouter } from "next/navigation";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter tasks..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statuses}
          />
        )}
        {table.getColumn("priority") && (
          <DataTableFacetedFilter
            column={table.getColumn("priority")}
            title="Priority"
            options={priorities}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <Button
        variant="default"
        onClick={() => router.push("/task/new")}
        className="h-8 px-2 lg:px-3"
      >
        <Plus className="mr-2 h-4 w-4" />
        Create a new task
      </Button>
    </div>
  );
}
```

### Bringing all the pieces together to build the whole table

Create `/components/task-table/index.tsx`

```tsx
"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

import { DataTablePagination } from "./table-pagination";
import { DataTableToolbar } from "./table-toolbar";
import { useStoreSync } from "@/lib/store/zustand";
import { useTaskStore } from "@/lib/store/task";
import { z } from "zod";
import { Task, taskSchema } from "@/lib/schema";
import { columns } from "./columns";

interface TableProps {
  data: Task[];
}

export default function TaskTable({ data }: TableProps) {
  const taskStore = useStoreSync(useTaskStore, { tasks: data })();
  const tasks = z.array(taskSchema).parse(taskStore.tasks);
  return <DataTable data={tasks} columns={columns} />;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
```

### Add the table to the homepage

Update `/app/page.tsx`

```tsx
import { getAllTasks } from "@/lib/task/handler";
import TaskTable from "@/components/task-table";
import { surrealDatabase } from "./api/lib/surreal";

export default async function Home() {
  const { data } = await getAllTasks();

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bonjour!</h2>
        </div>
      </div>

      <TaskTable data={data ?? []} />
    </div>
  );
}
```

## That’s it now run the server and use the application!!!

Thank you for reading and coding till the end.  Peace out ✌️

Here's the [GitHub repository](https://github.com/sourabpramanik/example-nextjs-surrealdb) for the whole project