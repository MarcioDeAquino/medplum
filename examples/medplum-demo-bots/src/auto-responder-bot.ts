// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Auto-responder bot (demo).
 * Create a new message once to the first Practitioner message in a thread
 * by creating a new Communication with a predefined message.
 * Skips if an auto-response already exists for that thread.
 */

import { BotEvent, MedplumClient } from '@medplum/core';
import { Communication } from '@medplum/fhirtypes';

export async function handler(
  medplum: MedplumClient,
  event: BotEvent<Communication>
): Promise<Communication | undefined> {
  const communication = event.input;
  if (!communication.sender?.reference?.startsWith('Practitioner/')) {
    return undefined;
  }
  if (!communication.partOf?.find((partOf) => partOf.reference?.startsWith('Communication/'))) {
    return undefined;
  }

  const previousAutoResponse = await medplum.searchResources(
    'Communication',
    `identifier=auto-response-${communication.partOf[0].reference}`
  );

  if (previousAutoResponse.length > 0) {
    return undefined;
  }

  const autoResponse = await medplum.createResource<Communication>({
    resourceType: 'Communication',
    status: 'in-progress',
    sender: undefined,
    recipient: [communication.sender],
    payload: [
      {
        contentString: 'This is an auto generated response',
      },
    ],
    partOf: communication.partOf,
    identifier: [{ system: 'http://example.com', value: `auto-response-${communication.partOf[0].reference}` }],
  });

  return autoResponse;
}
