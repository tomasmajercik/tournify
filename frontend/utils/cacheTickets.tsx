import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '@/config/config';
import { getCachedImageUri } from '@/utils/cacheImage';

type CachedTicket = {
    id: string;
    ticket: any;
    tournament: any;
    teamsCount: number;
    enrolledTeams: any[];
};

export const cacheAllTickets = async () => {
    const token = await AsyncStorage.getItem('token');
    const userId = await AsyncStorage.getItem('userId');
    if (!token || !userId) {
        console.error('Token or userId not found');
        return;
    }

    try {
        const ticketsRes = await fetch(`${API_BASE_URL}/users/${userId}/tickets`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!ticketsRes.ok) {
            const err = await ticketsRes.json();
            // console.error('Failed to fetch ticket list:', err);
            return;
        }

        const tickets = await ticketsRes.json();
        const detailedTickets: CachedTicket[] = [];

        console.log(`Found ${tickets.length} tickets to cache...`);

        for (const ticket of tickets) {
            try {
                console.log(`Fetching details for ticket ${ticket.id}...`);

                // Must fetch /qr to get tournament_id and other details
                const ticketRes = await fetch(`${API_BASE_URL}/users/${userId}/tickets/${ticket.id}/qr`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!ticketRes.ok) {
                    console.warn(`❌ Skipping ticket ${ticket.id}, QR fetch failed`);
                    continue;
                }

                const ticketData = await ticketRes.json();
                const ticketInfo = ticketData[0];

                if (!ticketInfo?.tournament_id) {
                    console.warn(`⚠️ Skipping ticket ${ticket.id}, no tournament_id found`);
                    continue;
                }

                // Now fetch related tournament details
                const [tournamentRes, teamCountRes, enrolledRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/tournaments/${ticketInfo.tournament_id}/info`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }),
                    fetch(`${API_BASE_URL}/tournaments/${ticketInfo.tournament_id}/teams/count`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }),
                    fetch(`${API_BASE_URL}/tournaments/${ticketInfo.tournament_id}/enrolled`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }),
                ]);

                if (!tournamentRes.ok) {
                    console.warn(`❌ Skipping ticket ${ticket.id}, tournament fetch failed`);
                    continue;
                }

                const tournament = await tournamentRes.json();
                const teamCountData = teamCountRes.ok && teamCountRes.status !== 204
                    ? await teamCountRes.json()
                    : [];
                const enrolled = enrolledRes.ok ? await enrolledRes.json() : [];

                const categoryImageUrl = `${API_BASE_URL}/category/images/${tournament.category_image}`;
                const localImageUri = await getCachedImageUri(categoryImageUrl, token); // pass token if required
                tournament.localCategoryImage = localImageUri;

                const cachedTicket: CachedTicket = {
                    id: ticket.id,
                    ticket: ticketInfo,
                    tournament,
                    teamsCount: teamCountData[0]?.team_count ?? 0,
                    enrolledTeams: enrolled,
                };

                detailedTickets.push(cachedTicket);

                console.log(`📦 Cached ticket: ${ticket.id}`, {
                    ticket: cachedTicket.ticket,
                    tournament: tournament.tournament_name,
                    teamsCount: cachedTicket.teamsCount,
                    enrolledTeams: cachedTicket.enrolledTeams.length,
                });

            } catch (err) {
                console.error(`Error caching ticket ${ticket.id}:`, err);
            }
        }

        await AsyncStorage.setItem('cachedTickets', JSON.stringify(detailedTickets));
        console.log('✅ Tickets cached successfully');
    } catch (err) {
        console.log('❌ Error caching all tickets:', err);
    }
};

