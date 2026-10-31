import type {ChapterKey} from './content';
export type ExperienceKey=Exclude<ChapterKey,'community'>;
interface ExperienceDetail {focus:string;skills:string[];contributions:string[];image?:string;imageAlt?:string}
export const experienceDetails:Record<ExperienceKey,ExperienceDetail>={
 research:{focus:'Applied AI research',skills:['Python','SVR','SHAP','Streamlit'],contributions:[
  'Implement and extend a FAHP-weighted Support Vector Regression framework using COCOMO-81, NASA-93, and curated GitHub software engineering datasets.',
  'Build data collection and feature-engineering pipelines, including repository metrics and AI-assisted development indicators.',
  'Develop a Streamlit research application with SHAP explanations, prediction intervals, and project effort analysis.',
  'Build the baseline platform for future Mitacs-supported research on AI-driven software engineering.'
 ]},
 engineering:{focus:'Developer tooling & reliability',skills:['Bash','PowerShell','Docker Compose','CI'],contributions:[
  'Consolidated developer setup across seven teams into one hardware-aware workflow that detects operating system, GPU, and RAM.',
  'Fixed the shallow-fetch issue that caused merge-base failures in the CI detect job.',
  'Corrected invalid Docker Compose service names in the original startup scripts.',
  'Implemented a submodule initialization policy that updates fresh checkouts while keeping existing checkouts intact.',
  'Validated Windows, Debian WSL, and all eight team configurations; the scripts passed independent QA review.'
 ]},
 teaching:{focus:'Peer learning facilitation',skills:['Facilitation','C programming','Collaborative learning'],contributions:[
  'Plan and facilitate two weekly Peer Assisted Learning sessions for around 35 first-year Programming Principles students.',
  'Prepare practical C programming exercises and guided problem-solving activities around core course concepts.',
  'Use questions and peer discussion to help students explain their reasoning, compare approaches, and work through problems together.',
  'Structure an environment where students actively practise, share ideas, and build confidence in their own learning.'
 ]},
 oer:{focus:'Digital equity engineering',skills:['HTML','CSS','Pressbooks','H5P Studio','WordPress'],contributions:[
  'Build accessible HTML/CSS templates for Pressbooks, H5P Studio, and WordPress-based open courses.',
  'Support open learning materials used by 1,000+ students across Business, Health Sciences, and Community Services.',
  'Contribute to courses students can access at zero cost, combining reusable web templates with accessible educational content.',
  'Work with faculty and the Open Learning team on content editing, accessibility review, media research, and resource organization.'
 ],image:'/images/open-learning.jpg',imageAlt:'Open Learning team at the Open Access Week information table'},
 csi:{focus:'Student engagement',skills:['Student support','Event coordination','Campus engagement'],contributions:[
  'Answer student questions and connect students with CSI services and college resources.',
  'Support event planning, setup, facilitation, promotion, and attendee engagement.',
  'Gather student feedback and collaborate with the CSI team to create a welcoming campus experience.'
 ],image:'/images/csi.jpg',imageAlt:'Keshav wearing a Conestoga Students Inc. team shirt'}
};
