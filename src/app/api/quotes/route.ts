import { generateMotivationalQuotes } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const count = parseInt(searchParams.get('count') || '10');
        const theme = searchParams.get('theme') || 'general motivation';

        // Validate count
        if (count < 1 || count > 20) {
            return NextResponse.json(
                { error: 'Count must be between 1 and 20' },
                { status: 400 }
            );
        }

        const quotes = await generateMotivationalQuotes(count, theme);

        return NextResponse.json({
            success: true,
            quotes,
            count: quotes.length
        });

    } catch (error) {
        console.error('Error generating motivational quotes:', error);

        // Return a minimal fallback response
        const fallbackQuotes = [
            {
                id: `fallback-${Date.now()}`,
                text: "Every day is a new opportunity to grow and improve yourself.",
                author: "AI Assistant"
            }
        ];

        return NextResponse.json({
            success: false,
            quotes: fallbackQuotes,
            count: fallbackQuotes.length,
            error: 'Failed to generate quotes, using fallback'
        }, { status: 200 }); // Return 200 so component can still use the fallback
    }
}
