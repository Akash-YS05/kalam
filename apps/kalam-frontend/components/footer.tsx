import { Github, Linkedin, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative py-16 px-4 border-t border-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-8 md:mb-0">
            <div className="text-3xl font-thin text-metallic mb-2">Kalam</div>
            <p className="text-metallic-subtle font-light">© 2024 Kalam. All rights reserved.</p>
          </div>

          <div className="flex items-center space-x-6">
            <a href="https://x.com/akashpandeytwt" className="text-metallic-subtle hover:text-metallic transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://github.com/Akash-YS05" className="text-metallic-subtle hover:text-metallic transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://linkedin.com/in/li-akash-pandey" className="text-metallic-subtle hover:text-metallic transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
