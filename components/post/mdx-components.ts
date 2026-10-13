import { Figure } from "@/components/post/Figure";
import * as Diagrams from "@/components/diagrams";
import { StepThrough } from "@/components/interactive/StepThrough";
import { Tabs } from "@/components/interactive/Tabs";
import { Checklist, Check } from "@/components/interactive/Checklist";
import { Quiz } from "@/components/interactive/Quiz";
import { Step, Tab, Choice, Answer } from "@/components/interactive/slots";

/**
 * Visual and interactive blocks available to every post's MDX, by name.
 * PostArticle spreads this map into MDXRemote's `components`. Diagrams come in
 * through components/diagrams/index.ts, so adding a diagram there is enough to
 * use it in a post. Props are string attributes and children only:
 * next-mdx-remote strips JS-expression props (`prop={…}`) from post MDX.
 */
export const POST_VISUALS = {
  Figure,
  ...Diagrams,
  StepThrough,
  Step,
  Tabs,
  Tab,
  Checklist,
  Check,
  Quiz,
  Choice,
  Answer,
};
