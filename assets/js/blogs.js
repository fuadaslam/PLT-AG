document.addEventListener("DOMContentLoaded", () => {
    if (typeof supabaseClient !== 'undefined') {
        fetchBlogs();
    } else {
        document.getElementById('blogsContainer').innerHTML = `
            <div class="empty-state">
                <i class="bx bx-error"></i>
                <h3>Database Error</h3>
                <p>Could not connect to Supabase to load blogs.</p>
            </div>
        `;
    }
});

async function fetchBlogs() {
    const container = document.getElementById('blogsContainer');

    try {
        const { data: snapshot, error } = await supabaseClient.from('blogs').select('*').order('createdAt', { ascending: false });
        
        if (error) throw error;

        if (!snapshot || snapshot.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bx bx-news"></i>
                    <h3>No Blogs Found</h3>
                    <p>Check back later for new updates.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = ''; // Clear loading state

        snapshot.forEach(blog => {
            const dateStr = blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : 'Recent';
            
            // Check if there is a youtube URL, if so embed it, else use the image
            let mediaHtml = '';
            if (blog.youtubeUrl) {
                // simple extraction of youtube video ID
                const videoIdMatch = blog.youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
                if (videoIdMatch && videoIdMatch[1] && /^[A-Za-z0-9_-]+$/.test(videoIdMatch[1])) {
                    mediaHtml = `<iframe src="https://www.youtube.com/embed/${videoIdMatch[1]}" frameborder="0" allowfullscreen></iframe>`;
                } else if (blog.youtubeUrl.startsWith('http://') || blog.youtubeUrl.startsWith('https://')) {
                    // Fallback if not standard format
                    mediaHtml = `<a href="${escapeHTML(blog.youtubeUrl)}" target="_blank" style="display:block; text-align:center; padding: 40px; background: #000; color: #fff;">Watch Video</a>`;
                } else {
                    mediaHtml = `<div style="display:block; text-align:center; padding: 40px; background: #000; color: #fff;">Invalid Video URL</div>`;
                }
            } else {
                const imgSrc = blog.image ? escapeHTML(blog.image) : 'assets/img/hero-bg.jpg';
                mediaHtml = `<img src="${imgSrc}" onerror="this.src='https://via.placeholder.com/400x250'" alt="${escapeHTML(blog.title)}">`;
            }

            // Create blog card
            const card = document.createElement('div');
            card.className = 'blog-card-enhanced';
            
            const contentId = `blog-content-${escapeHTML(String(blog.id))}`;

            card.innerHTML = `
                <div class="blog-media-wrapper">
                    ${mediaHtml}
                </div>
                <div class="blog-content-enhanced">
                    <span class="blog-date"><i class="bx bx-calendar"></i> ${escapeHTML(dateStr)}</span>
                    <h4>${escapeHTML(blog.title || 'Untitled Blog')}</h4>
                    <p>${escapeHTML(blog.shortDesc || '')}</p>
                    <div id="${contentId}" style="display:none; margin-bottom: 20px;">
                        <hr style="margin: 10px 0;">
                        ${sanitizeHTML(blog.content || '')}
                    </div>
                    <div class="blog-read-more">
                        <button class="btn-read-more" onclick="toggleBlogContent('${contentId}', this)">
                            Read More <i class="bx bx-chevron-down"></i>
                        </button>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading blogs:", error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="bx bx-error"></i>
                <h3>Error Loading Blogs</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

// Global function to toggle content
window.toggleBlogContent = function(contentId, btn) {
    const contentDiv = document.getElementById(contentId);
    if (!contentDiv) return;
    if (contentDiv.style.display === 'none') {
        contentDiv.style.display = 'block';
        btn.innerHTML = 'Show Less <i class="bx bx-chevron-up"></i>';
    } else {
        contentDiv.style.display = 'none';
        btn.innerHTML = 'Read More <i class="bx bx-chevron-down"></i>';
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function sanitizeHTML(html) {
    if (!html) return '';
    // Use DOMPurify when available (loaded via CDN in blogs.html)
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    }
    // Fallback: strip dangerous elements and attributes
    const FORBIDDEN_TAGS = ['script','iframe','object','embed','base','form','link','meta','svg','math'];
    const temp = document.createElement('div');
    temp.innerHTML = html;
    FORBIDDEN_TAGS.forEach(tag => {
        temp.querySelectorAll(tag).forEach(el => el.remove());
    });
    temp.querySelectorAll('*').forEach(el => {
        for (let i = el.attributes.length - 1; i >= 0; i--) {
            const name = el.attributes[i].name;
            const value = el.attributes[i].value.trim().toLowerCase();
            if (name.startsWith('on')) {
                el.removeAttribute(name);
            } else if (name === 'href' || name === 'src' || name === 'xlink:href' || name === 'action') {
                if (value.startsWith('javascript:') || value.startsWith('data:')) {
                    el.removeAttribute(name);
                }
            } else if (name === 'style') {
                // Remove style attributes containing expression() or javascript:
                if (value.includes('expression(') || value.includes('javascript:')) {
                    el.removeAttribute(name);
                }
            }
        }
    });
    return temp.innerHTML;
}
