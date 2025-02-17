/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

export interface Kubernetes {
  pod?: { uid?: string | null; name?: string };
  namespace?: string;
  replicaset?: {
    name?: string;
  };
  deployment?: {
    name?: string;
  };
  container?: {
    id?: string;
    name?: string;
  };
}
