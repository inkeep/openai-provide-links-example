import { z } from "zod";

/* Inkeep QA Tools */

const InkeepRecordTypes = z.enum([
	"documentation",
	"site",
	"discourse_post",
	"github_issue",
	"github_discussion",
	"stackoverflow_question",
	"discord_forum_post",
	"discord_message",
	"custom_question_answer",
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
		type: LinkType.nullish(),
		breadcrumbs: z.array(z.string()).nullish(),
	})
	.passthrough();

const LinksSchema = z.array(LinkSchema).nullish();

export const ProvideLinksToolSchema = z.object({
	links: LinksSchema,
});

const KnownAnswerConfidence = z.enum([
	"very_confident",
	"somewhat_confident",
	"not_confident",
	"no_sources",
	"other",
]);

const AnswerConfidence = z.union([KnownAnswerConfidence, z.string()]); // evolvable

const AIAnnotationsToolSchema = z
	.object({
		answerConfidence: AnswerConfidence,
	})
	.passthrough();

export const ProvideAIAnnotationsToolSchema = z.object({
	aiAnnotations: AIAnnotationsToolSchema,
});