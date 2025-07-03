/**
 * Telegram Bot API utility for sending notifications
 */

interface TelegramMessage {
    text: string;
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disable_web_page_preview?: boolean;
}

interface TelegramResponse {
    ok: boolean;
    result?: any;
    error_code?: number;
    description?: string;
}

/**
 * Send a message to Telegram using the bot API
 */
export async function sendTelegramMessage(
    message: string,
    options: {
        parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
        disablePreview?: boolean;
        chatId?: string;
    } = {}
): Promise<{ success: boolean; error?: string }> {
    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = options.chatId || process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.error('Missing Telegram configuration:', {
                hasBotToken: !!botToken,
                hasChatId: !!chatId
            });
            return {
                success: false,
                error: 'Telegram bot token or chat ID not configured'
            };
        }

        const telegramMessage: TelegramMessage = {
            text: message,
        };

        if (options.parseMode) {
            telegramMessage.parse_mode = options.parseMode;
        }

        if (options.disablePreview) {
            telegramMessage.disable_web_page_preview = true;
        }

        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                ...telegramMessage,
            }),
        });

        const data: TelegramResponse = await response.json();

        if (!data.ok) {
            console.error('Telegram API error:', data);
            return {
                success: false,
                error: data.description || 'Failed to send telegram message'
            };
        }

        console.log('Telegram message sent successfully');
        return { success: true };

    } catch (error) {
        console.error('Error sending Telegram message:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Format a task creation message for Telegram
 */
export function formatTaskCreatedMessage(task: {
    title: string;
    description?: string;
    priority: string;
    tags?: string[];
    goalId?: string;
}): string {
    const priorityEmoji = {
        low: '🟢',
        medium: '🟡',
        high: '🔴'
    }[task.priority] || '⚪';

    const tagsText = task.tags && task.tags.length > 0
        ? `\n📝 Tags: ${task.tags.map(tag => `#${tag}`).join(' ')}`
        : '';

    const goalText = task.goalId
        ? `\n🎯 Linked to goal`
        : '';

    const descriptionText = task.description
        ? `\n📄 ${task.description}`
        : '';

    return `✅ *New Task Created*

${priorityEmoji} *${task.title}*${descriptionText}${tagsText}${goalText}

🕐 Created: ${new Date().toLocaleString()}`;
}

/**
 * Send a task creation notification to Telegram
 */
export async function sendTaskCreatedNotification(task: {
    title: string;
    description?: string;
    priority: string;
    tags?: string[];
    goalId?: string;
}): Promise<{ success: boolean; error?: string }> {
    const message = formatTaskCreatedMessage(task);

    return await sendTelegramMessage(message, {
        parseMode: 'Markdown',
        disablePreview: true,
    });
}
