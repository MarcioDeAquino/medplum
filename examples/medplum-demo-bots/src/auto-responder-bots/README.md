# Auto-Responder Bot

A Medplum bot that automatically responds to messages from practitioners in communication threads.

## Overview

The Auto-Responder Bot is a demonstration bot that shows how to create automated responses to FHIR Communication resources. When a practitioner sends a message in a communication thread, this bot automatically generates and sends a predefined response back to the practitioner after each message from the practitioner.

## Functionality

The bot performs the following actions:

1. **Monitors Communication Resources**: Listens for new Communication resources being created
2. **Validates Sender**: Only responds to messages sent by practitioners (resources with `sender.reference` starting with `Practitioner/`)
3. **Validates Thread Context**: Only responds to messages that are part of an existing communication thread (have `partOf` references to other Communication resources)
4. **Generates Auto-Response**: Creates a new Communication resource with:
   - Status: `in-progress`
   - Sender: The original recipient (typically a patient)
   - Recipient: The original sender (the practitioner)
   - Payload: A predefined message: "This is an auto generated response"
   - PartOf: Links to the same communication thread

## Code Structure

### Main Handler (`auto-responder-bot.ts`)

The main bot logic is contained in the `handler` function:

```typescript
export async function handler(
  medplum: MedplumClient,
  event: BotEvent<Communication>
): Promise<Communication | undefined>;
```

### Key Logic

1. **Sender Validation**: Checks if the message sender is a practitioner
2. **Thread Validation**: Ensures the message is part of a communication thread
3. **Response Creation**: Generates an automated response with reversed sender/recipient roles

## Usage

### Prerequisites

- Medplum account with bot creation permissions
- Understanding of FHIR Communication resources
- Access to the Medplum SDK

### Setup

1. Deploy the bot to your Medplum instance
2. Create a Subscription resource to trigger the bot on Communication resource creation:
   ```json
   {
     "resourceType": "Subscription",
     "status": "active",
     "reason": "Auto-responder bot trigger",
     "criteria": "Communication",
     "channel": {
       "type": "rest-hook",
       "endpoint": "Bot/<YOUR-BOT-ID>",
       "payload": "application/fhir+json"
     },
     "extension": [
       {
         "url": "https://medplum.com/fhir/StructureDefinition/subscription-supported-interaction",
         "valueCode": "create"
       }
     ]
   }
   ```
3. Ensure proper permissions for the bot to read and create Communication resources

### Configuration

The bot requires no additional configuration or secrets. It uses a hardcoded response message that can be customized by modifying the `contentString` in the payload.

## Testing

The bot includes comprehensive tests in `auto-responder-bot.test.ts` that cover:

- **Successful Auto-Response**: Verifies that the bot responds correctly to practitioner messages
- **Non-Practitioner Sender**: Confirms the bot ignores messages from non-practitioners
- **Missing Thread Context**: Ensures the bot doesn't respond to standalone messages

### Running Tests

```bash
npm test auto-responder-bot.test.ts
```

## Example Workflow

1. A practitioner sends a message to a patient in a communication thread
2. The Subscription resource detects the new Communication resource creation
3. The Subscription triggers the bot via the configured webhook endpoint
4. The bot validates that the sender is a practitioner and the message is part of a thread
5. The bot creates an automated response from the patient back to the practitioner
6. The response appears in the same communication thread
7. This process repeats for each subsequent message from the practitioner

## Customization

To customize the bot's behavior:

- **Response Message**: Modify the `contentString` in the payload
- **Sender Types**: Change the practitioner check to respond to other resource types
- **Response Logic**: Add more sophisticated response generation based on message content
- **Thread Validation**: Modify the thread validation logic for different use cases

## Limitations

- Uses a static response message
- Only validates practitioner senders
- Requires messages to be part of a communication thread
- Requires a properly configured Subscription resource to trigger the bot
