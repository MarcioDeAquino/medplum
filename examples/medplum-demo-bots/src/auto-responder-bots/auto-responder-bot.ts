// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Auto-responder bot (demo).
 * Create a new message after each Practitioner message in a thread
 * by creating a new Communication with a predefined message.
 */

import { BotEvent, MedplumClient } from '@medplum/core';
import { Communication, Patient, Reference } from '@medplum/fhirtypes';

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

  const autoResponse = await medplum.createResource<Communication>({
    resourceType: 'Communication',
    status: 'in-progress',
    sender: communication.recipient?.[0] as Reference<Patient>,
    recipient: [communication.sender],
    payload: [
      {
        contentString: 'This is an auto generated response',
      },
    ],
    partOf: communication.partOf,
    sent: new Date().toISOString(),
  });

  return autoResponse;
}
