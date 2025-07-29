const Footer = () => {
  return (
    <footer className="py-8 bg-muted/50 border-t">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} MemoQuiz. All rights reserved.</p>
        <p className="text-sm mt-2">
          Built with a passion for learning.
        </p>
      </div>
    </footer>
  );
};

export default Footer; 