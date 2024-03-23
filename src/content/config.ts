import { z, defineCollection } from 'astro:content';

const postSchema = z.object({
    draft: z.boolean().default(false),
    date: z.date().transform((str: string) => new Date(str)),
    title: z.string(),
    tags: z.array(z.string()).optional(),
    author: z.string(),
    share: z
        .object({
            image: z.string().url().optional(),
            title: z.string(),
            description: z.string(),
        })
        .strict(),
});
export const collections = {
    posts: defineCollection({
        schema: postSchema,
    }),
};

export type PostSchema = z.infer<typeof postSchema>;