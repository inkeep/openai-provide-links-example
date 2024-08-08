import { z } from 'zod'

const InkeepRecordTypes = z.enum([
  'documentation',
  'site',
  'discourse_post',
  'github_issue',
  'github_discussion',
  'stackoverflow_question',
  'discord_forum_post',
  'discord_message',
  'custom_question_answer'
])

const LinkType = z.union([
  InkeepRecordTypes,
  z.string() // catch all
])

const LinkSchema = z
  .object({
    label: z.string().nullish(), // what it's referenced as in the message body, e.g. '1'
    url: z.string(),
    title: z.string().nullish(),
    description: z.string().nullish(),
    type: LinkType.nullish(),
    breadcrumbs: z.array(z.string()).nullish()
  })
  .passthrough()

export const LinksSchema = z.array(LinkSchema).nullish()

export const LinksToolSchema = z.object({
  links: LinksSchema
})

export const LinksTool = {
  description: "Retrieve links related to the assistant's response",
  parameters: LinksToolSchema
}
