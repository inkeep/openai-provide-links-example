import { z } from 'zod';

const InkeepRecordTypes = z.enum([
  'documentation',
  'site',
  'discourse_post',
  'github_issue',
  'github_discussion',
  'stackoverflow_question',
  'discord_forum_post',
  'discord_message',
  'custom_question_answer',
]);

const LinkType = z.union([
  InkeepRecordTypes,
  z.string(), // catch all
]);

const LinkSchema = z
  .object({
    label: z.string().nullish(), // the value of the footnote, e.g. `1`
    url: z.string(),
    title: z.string().nullish(),
    description: z.string().nullish(),
    type: LinkType.nullish(),
    breadcrumbs: z.array(z.string()).nullish(),
  })
  .passthrough();

export const LinksSchema = z.array(LinkSchema).nullish();

export const LinksToolSchema = z.object({
  text: z.string(),
  links: LinksSchema,
}); // schema used when `provideLinks` is invoked
