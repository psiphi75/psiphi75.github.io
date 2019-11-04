_ZN3cmp9iterative17he662d27c38006637E:
	.cfi_startproc
	testq	%rdi, %rdi
	je	.LBB1_1
	movl	$1, %ecx
	xorl	%edx, %edx
	xorl	%eax, %eax
	.p2align	4, 0x90
.LBB1_4:
	movl	%edx, %esi
	andl	$1, %esi
	negq	%rsi
	andq	%rdx, %rsi
	addq	%rsi, %rax
	movq	%rcx, %rdx
	imulq	%rcx, %rdx
	addq	$1, %rcx
	cmpq	%rdi, %rdx
	jb	.LBB1_4
	retq
.LBB1_1:
	xorl	%eax, %eax
	retq
.Lfunc_end1:
	.size	_ZN3cmp9iterative17he662d27c38006637E, .Lfunc_end1-_ZN3cmp9iterative17he662d27c38006637E
	.cfi_endproc