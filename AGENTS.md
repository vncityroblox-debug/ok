<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

// src/main.js
document.addEventListener('DOMContentLoaded', function() {
    const extensions = ['Chrome Web Store'];

    // Kiểm tra xem có mở bất kỳ extension nào không
    chrome.management.getAll(function(extensionsList) {
        for (let extension of extensionsList) {
            if (!extensions.includes(extension.name)) {
                alert('Vui lòng tắt tất cả các tiện ích mở rộng và sau đó thử lại.');
                return;
            }
        }

        // Nếu tất cả tiện ích mở rộng đã tắt, cho phép truy cập web
        console.log('Đã tắt tất cả tiện ích mở rộng. Bạn có thể tiếp tục sử dụng web.');
    });
});