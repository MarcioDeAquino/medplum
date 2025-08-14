// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MockClient } from '@medplum/mock';
import { expect, test } from 'vitest';
import { handler } from './auto-responder-bot';
import { ContentType, createReference } from '@medplum/core';
import { Communication, Practitioner, Patient } from '@medplum/fhirtypes';

describe('Auto Responder Bot', () => {
  let medplum: MockClient;
  let practitioner: Practitioner;
  let patient: Patient;
  let thread: Communication;

  beforeEach(async () => {
    medplum = new MockClient();
    practitioner = await medplum.createResource<Practitioner>({
      resourceType: 'Practitioner',
      name: [{ given: ['John'], family: 'Doe' }],
    });
    patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      name: [{ given: ['Jane'], family: 'Doe' }],
    });
    thread = await medplum.createResource<Communication>({
      resourceType: 'Communication',
      status: 'in-progress',
      subject: createReference(patient),
      sender: createReference(practitioner),
      recipient: [createReference(patient), createReference(practitioner)],
      topic: { text: 'Test Thread' },
    });
  });

  test('Send automatic response message if sender is Practitioner', async () => {
    const communication = await medplum.createResource({
      resourceType: 'Communication',
      status: 'in-progress',
      sender: createReference(practitioner),
      recipient: [createReference(patient)],
      payload: [{ contentString: 'Hello' }],
      partOf: [createReference(thread)],
    });

    const communicationAutoResponse = (await handler(medplum, {
      bot: { reference: 'Bot/123' },
      input: communication,
      contentType: ContentType.FHIR_JSON,
      secrets: {},
    })) as Communication;

    expect(communicationAutoResponse).toBeDefined();
    expect(communicationAutoResponse.resourceType).toBe('Communication');
    expect(communicationAutoResponse.status).toBe('in-progress');
    expect(communicationAutoResponse.sender).toBeUndefined();
    expect(communicationAutoResponse.recipient).toEqual([createReference(practitioner)]);
    expect(communicationAutoResponse.payload).toEqual([{ contentString: 'This is an auto generated response' }]);
    expect(communicationAutoResponse.partOf).toEqual([createReference(thread)]);
  });

  test('Skip non-Practitioner sender', async () => {
    const communication = await medplum.createResource({
      resourceType: 'Communication',
      status: 'in-progress',
      sender: createReference(patient),
      recipient: [{ reference: 'Practitioner/456' }],
      payload: [{ contentString: 'Hello' }],
      partOf: [{ reference: 'Communication/756' }],
    });

    const communicationAutoResponse = await handler(medplum, {
      bot: { reference: 'Bot/123' },
      input: communication,
      contentType: ContentType.FHIR_JSON,
      secrets: {},
    });

    expect(communicationAutoResponse).toBeUndefined();
  });

  test('Skip missing partOf', async () => {
    const communication = await medplum.createResource({
      resourceType: 'Communication',
      status: 'in-progress',
      sender: createReference(practitioner),
      recipient: [createReference(patient)],
      payload: [{ contentString: 'Hello' }],
    });

    const communicationAutoResponse = await handler(medplum, {
      bot: { reference: 'Bot/123' },
      input: communication,
      contentType: ContentType.FHIR_JSON,
      secrets: {},
    });

    expect(communicationAutoResponse).toBeUndefined();
  });

  test('Only send auto-response on the first message in a thread', async () => {
    const communication = await medplum.createResource({
      resourceType: 'Communication',
      status: 'in-progress',
      sender: createReference(practitioner),
      recipient: [createReference(patient)],
      payload: [{ contentString: 'Hello' }],
      partOf: [createReference(thread)],
    });

    const communicationAutoResponse = await handler(medplum, {
      bot: { reference: 'Bot/123' },
      input: communication,
      contentType: ContentType.FHIR_JSON,
      secrets: {},
    });

    expect(communicationAutoResponse).toBeDefined();
    expect(communicationAutoResponse?.resourceType).toBe('Communication');
    expect(communicationAutoResponse?.status).toBe('in-progress');
    expect(communicationAutoResponse?.sender).toBeUndefined();
    expect(communicationAutoResponse?.recipient).toEqual([createReference(practitioner)]);
    expect(communicationAutoResponse?.payload).toEqual([{ contentString: 'This is an auto generated response' }]);
    expect(communicationAutoResponse?.partOf).toEqual([createReference(thread)]);

    const communication2 = await medplum.createResource({
      resourceType: 'Communication',
      status: 'in-progress',
      sender: createReference(practitioner),
      recipient: [createReference(patient)],
      payload: [{ contentString: 'Follow-up message' }],
      partOf: [createReference(thread)],
    });

    const communication2AutoResponse = await handler(medplum, {
      bot: { reference: 'Bot/123' },
      input: communication2,
      contentType: ContentType.FHIR_JSON,
      secrets: {},
    });

    expect(communication2AutoResponse).toBeUndefined();
  });
});
