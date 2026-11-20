<?php
declare(strict_types=1);
/** Curated official-domain RSS/Atom metadata sources. Every new source is DISABLED in SQL. */
return [
 'github_changelog'=>[
  'name'=>'GitHub Changelog', 'url'=>'https://github.blog/changelog/feed/',
  'host'=>'github.blog', 'topic'=>'developer_platform'],
 'kubernetes_blog'=>[
  'name'=>'Kubernetes Project Blog', 'url'=>'https://kubernetes.io/feed.xml',
  'host'=>'kubernetes.io', 'topic'=>'cloud_native'],
 'go_blog'=>[
  'name'=>'Go Project Blog', 'url'=>'https://go.dev/blog/feed.atom',
  'host'=>'go.dev', 'topic'=>'engineering'],
 'cncf_blog'=>[
  'name'=>'CNCF Blog', 'url'=>'https://www.cncf.io/feed/',
  'host'=>'www.cncf.io', 'topic'=>'cloud_native'],
];
